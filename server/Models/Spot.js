const mongoose = require("mongoose");

const spotSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true },            
    location: {                                               
      type:     { type: String, enum: ["Point"], required: true, default: "Point" },
      coordinates: { type: [Number], required: true },        
    },
    pricePerHour: { type: Number, default: 30 },             
    isOccupied:   { type: Boolean, default: false },
  },
  { timestamps: true }
);


spotSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Spot", spotSchema);
