
const Reservation = require("../Models/Reservation");
const Spot        = require("../Models/Spot");

/**
 * Kick-off the auto-release job.
 * @param {import("express").Express} app 
 */
module.exports = function startExpiryJob(app) {
  setInterval(async () => {
    const now = new Date();

    
    const expired = await Reservation.find({
      status: "active",
      expiresAt: { $lte: now },
    });

    if (!expired.length) return;                    

    for (const r of expired) {
      r.status = "cancelled";
      await r.save();

      
      const spot = await Spot.findByIdAndUpdate(
        r.spotId,
        { $set: { isOccupied: false } },
        { new: true }
      );

      
      const io = app.get("io");                    
      if (io) io.emit("spotUpdated", spot);
    }

    console.log(`⏱  Auto-released ${expired.length} reservations`);
  }, 60_000);
};
