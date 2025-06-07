const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const User = require("../Models/User");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// POST /auth/google
exports.googleLogin = async (req, res) => {
  const { token } = req.body;
console.log("Token from frontend:", token);
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { name, email, picture } = ticket.getPayload();

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ name, email, picture });
    }

    const jwtToken = jwt.sign({ id: user._id, email }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res
      .cookie("token", jwtToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Lax",
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      })
      .status(200)
      .json({ user });

  } catch (err) {
    console.error("Google Sign-In error:", err);
    res.status(401).json({ message: "Invalid Google token" });
  }
};

// GET /auth/me
exports.getCurrentUser = async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "Not logged in" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-__v");
    if (!user) return res.status(404).json({ message: "User not found" });
   
    res.json({ user });
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// POST /auth/logout
exports.logout = (req, res) => {
  res.clearCookie("token").json({ message: "Logged out" });
};
