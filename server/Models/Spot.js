const mongoose = require("mongoose");

const spotSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true },            // “CP Block-B Lot”
    location: {                                               // GeoJSON point
      type:     { type: String, enum: ["Point"], required: true, default: "Point" },
      coordinates: { type: [Number], required: true },        // [lng, lat]
    },
    pricePerHour: { type: Number, default: 30 },              // ₹
    isOccupied:   { type: Boolean, default: false },
  },
  { timestamps: true }
);

// 2dsphere index for $geoNear queries
spotSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Spot", spotSchema);
