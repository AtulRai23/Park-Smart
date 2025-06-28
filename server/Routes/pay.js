const express = require("express");
const router = express.Router();
const { createOrder, webhook } = require("../Controllers/payController");
const auth = require("../middleware/auth");


router.post("/order", auth, createOrder);


router.post("/webhook", express.raw({ type: "*/*" }), webhook);

module.exports = router;
