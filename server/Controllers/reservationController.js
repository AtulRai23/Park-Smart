const Spot        = require("../Models/Spot");
const Reservation = require("../Models/Reservation");



exports.createReservation = async (req, res) => {
  const userId  = req.user.id;         
  const { spotId } = req.body;

  try {
    
    const spot = await Spot.findOneAndUpdate(
      { _id: spotId, isOccupied: false },
      { $set: { isOccupied: true } },
      { new: true }
    );
    if (!spot)
      return res.status(409).json({ msg: "Spot no longer available" });

    
    const reservation = await Reservation.create({
      userId,
      spotId,
      pricePerHour: spot.pricePerHour,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      status: "active",
    });

    
    const io = req.app.get("io");      
    if (io) io.emit("spotUpdated", spot);

    res.status(201).json(reservation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err.message });
  }
};


exports.updateReservation = async (req, res) => {
  const { id }     = req.params;
  const { status } = req.body;

  try {
    const reservation = await Reservation.findById(id);
    if (!reservation)
      return res.status(404).json({ msg: "Not found" });

    reservation.status = status;
    await reservation.save();

    
    if (status !== "active") {
      const spot = await Spot.findByIdAndUpdate(
        reservation.spotId,
        { $set: { isOccupied: false } },
        { new: true }
      );
      const io = req.app.get("io");    
      if (io) io.emit("spotUpdated", spot);
    }

    res.json(reservation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err.message });
  }
};

exports.getMyReservations = async (req, res) => {
  const list = await Reservation
    .find({ userId: req.user.id })
    .populate("spotId", "name pricePerHour")   
    .sort({ createdAt: -1 });

  res.json(list);
};


