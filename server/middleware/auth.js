
const jwt = require("jsonwebtoken");

module.exports = function auth(req, res, next) {
  try {
    
    const token = req.cookies.token;
    if (!token) throw new Error("Missing token");

    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;                 
    next();
  } catch (err) {
    return res.status(401).json({ msg: "Unauthorised" });
  }
};
