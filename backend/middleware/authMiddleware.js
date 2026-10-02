const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Driver = require("../models/Driver");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role === "driver") {
      req.driver = await Driver.findOne({ email: user.email });
      if (!req.driver) {
        return res.status(403).json({ success: false, message: "No driver record is linked to this account" });
      }
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

const authorize = (...roles) => (req, res, next) => {
  const effectiveRole = req.user?.role === "admin" ? "fleetManager" : req.user?.role;
  if (!req.user || !roles.includes(effectiveRole)) {
    return res.status(403).json({ success: false, message: "You do not have permission to perform this action" });
  }
  return next();
};

module.exports = protect;
module.exports.authorize = authorize;
