// ----------------  server/cron/expireReservations.js  ------------------
const Reservation = require("../Models/Reservation");
const Spot        = require("../Models/Spot");

/**
 * Kick-off the auto-release job.
 * @param {import("express").Express} app - express app that holds the io instance
 */
module.exports = function startExpiryJob(app) {
  setInterval(async () => {
    const now = new Date();

    // 1. pull all expired active reservations
    const expired = await Reservation.find({
      status: "active",
      expiresAt: { $lte: now },
    });

    if (!expired.length) return;                    // nothing to do

    for (const r of expired) {
      r.status = "cancelled";
      await r.save();

      // 2. free the spot
      const spot = await Spot.findByIdAndUpdate(
        r.spotId,
        { $set: { isOccupied: false } },
        { new: true }
      );

      // 3. broadcast update
      const io = app.get("io");                    // <-- grab safely
      if (io) io.emit("spotUpdated", spot);
    }

    console.log(`⏱  Auto-released ${expired.length} reservations`);
  }, 60_000); // every minute
};
