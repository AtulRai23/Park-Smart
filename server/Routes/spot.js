const router = require("express").Router();
const {
  createSpot,
  updateSpot,
  nearbySpots,
} = require("../Controllers/spotController");

router.post("/",    createSpot);              
router.patch("/:id", updateSpot);
router.get("/nearby", nearbySpots);

module.exports = router;
