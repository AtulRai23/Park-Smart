// ------------------  server/Middleware/auth.js  ------------------
const jwt = require("jsonwebtoken");

module.exports = function auth(req, res, next) {
  try {
    // ⭐️ we stored the JWT in an http-only cookie called “token”
    const token = req.cookies.token;
    if (!token) throw new Error("Missing token");

    // verify & attach the decoded user
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;                 // { id, email, … }
    next();
  } catch (err) {
    return res.status(401).json({ msg: "Unauthorised" });
  }
};
