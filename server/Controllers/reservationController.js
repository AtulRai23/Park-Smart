const Spot        = require("../Models/Spot");
const Reservation = require("../Models/Reservation");
// ⚠️  remove circular import — we'll grab io from req.app later

// POST /api/reservations  { spotId }
exports.createReservation = async (req, res) => {
  const userId  = req.user.id;         // comes from auth middleware
  const { spotId } = req.body;

  try {
    // 1. lock the spot if it’s still free
    const spot = await Spot.findOneAndUpdate(
      { _id: spotId, isOccupied: false },
      { $set: { isOccupied: true } },
      { new: true }
    );
    if (!spot)
      return res.status(409).json({ msg: "Spot no longer available" });

    // 2. create reservation (10-min hold)
    const reservation = await Reservation.create({
      userId,
      spotId,
      pricePerHour: spot.pricePerHour,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      status: "active",
    });

    // 3. broadcast update safely
    const io = req.app.get("io");      // <── fetch Socket.IO instance
    if (io) io.emit("spotUpdated", spot);

    res.status(201).json(reservation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err.message });
  }
};

// PATCH /api/reservations/:id  { status }
exports.updateReservation = async (req, res) => {
  const { id }     = req.params;
  const { status } = req.body;

  try {
    const reservation = await Reservation.findById(id);
    if (!reservation)
      return res.status(404).json({ msg: "Not found" });

    reservation.status = status;
    await reservation.save();

    // free the spot if cancelled/completed
    if (status !== "active") {
      const spot = await Spot.findByIdAndUpdate(
        reservation.spotId,
        { $set: { isOccupied: false } },
        { new: true }
      );
      const io = req.app.get("io");    // <── same pattern
      if (io) io.emit("spotUpdated", spot);
    }

    res.json(reservation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err.message });
  }
};
// GET /api/reservations/me  → all reservations for the logged-in user
exports.getMyReservations = async (req, res) => {
  const list = await Reservation
    .find({ userId: req.user.id })
    .populate("spotId", "name pricePerHour")   // join spot name/price
    .sort({ createdAt: -1 });

  res.json(list);
};


