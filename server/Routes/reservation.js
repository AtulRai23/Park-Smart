const router = require("express").Router();
const { createReservation, updateReservation ,getMyReservations} =
  require("../Controllers/reservationController");
const protect = require("../middleware/protect");        // JWT cookie → req.user

router.post("/",  protect, createReservation);
router.patch("/:id", protect, updateReservation);
router.get("/me",    protect, getMyReservations);   
module.exports = router;
