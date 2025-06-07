const express = require("express");
const router = express.Router();
const { googleLogin, getCurrentUser, logout } = require("../Controllers/authcontroller");

router.post("/google", googleLogin);
router.get("/me", getCurrentUser);
router.post("/logout", logout);

module.exports = router;
