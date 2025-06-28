const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
  {
    userId:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    spotId:  { type: mongoose.Schema.Types.ObjectId, ref: "Spot", required: true },
    pricePerHour: Number,
    status: { type: String, enum: ["active", "cancelled", "completed"], default: "active" },
    expiresAt: Date,   
  },
  { timestamps: true }
);

module.exports = mongoose.model("Reservation", reservationSchema);
