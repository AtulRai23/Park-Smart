const Spot = require("../Models/Spot");


exports.createSpot = async (req, res) => {
  try {
    const spot = await Spot.create(req.body);
    res.status(201).json(spot);
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
};


exports.updateSpot = async (req, res) => {
  try {
    const spot = await Spot.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!spot) return res.status(404).json({ msg: "Not found" });
    res.json(spot);
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
};


exports.nearbySpots = async (req, res) => {
  const { lat, lng, radius = 1 } = req.query;          
  if (!lat || !lng) return res.status(400).json({ msg: "lat & lng required" });

  const spots = await Spot.aggregate([
    {
      $geoNear: {
        near: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
        distanceField: "distM",
        maxDistance: parseFloat(radius) * 1000,          
        spherical: true,
        query: { isOccupied: false },                    
      },
    },
    { $sort: { distM: 1 } },
  ]);

  res.json(spots);
};
