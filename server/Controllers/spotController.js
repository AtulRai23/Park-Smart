const Spot = require("../Models/Spot");

/* POST /api/spots  (admin only – but no auth guard yet) */
exports.createSpot = async (req, res) => {
  try {
    const spot = await Spot.create(req.body);
    res.status(201).json(spot);
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
};

/* PATCH /api/spots/:id  (update price or occupancy) */
exports.updateSpot = async (req, res) => {
  try {
    const spot = await Spot.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!spot) return res.status(404).json({ msg: "Not found" });
    res.json(spot);
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
};

/* GET /api/spots/nearby?lat=..&lng=..&radius=km */
exports.nearbySpots = async (req, res) => {
  const { lat, lng, radius = 1 } = req.query;          // radius in km
  if (!lat || !lng) return res.status(400).json({ msg: "lat & lng required" });

  const spots = await Spot.aggregate([
    {
      $geoNear: {
        near: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
        distanceField: "distM",
        maxDistance: parseFloat(radius) * 1000,          // km → m
        spherical: true,
        query: { isOccupied: false },                    // only free spots
      },
    },
    { $sort: { distM: 1 } },
  ]);

  res.json(spots);
};
