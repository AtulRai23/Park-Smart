// ------------------  server/Routes/pay.js  ------------------
const express = require("express");
const router  = express.Router();

const auth = require("../middleware/auth");
const {
  createOrder,
  webhook,
} = require("../Controllers/payController");

// 👇 order endpoint (protected)
router.post("/order", auth, createOrder);

// 👇 Razorpay webhook needs the *raw* body:
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  webhook
);

module.exports = router;
