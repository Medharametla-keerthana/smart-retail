const User = require("../models/User");
const jwt = require("jsonwebtoken");
const Driver = require("../models/Driver");
const Trip = require("../models/Trip");
const Notification = require("../models/Notification");
const Incident = require("../models/Incident");

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};


// Register User
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const role = req.body.role === "driver" ? "driver" : "customer";
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    // Check required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email and password",
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: normalizedEmail });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    if (role === "driver" && !(await Driver.findOne({ email: normalizedEmail }))) {
      return res.status(400).json({ success: false, message: "Ask your fleet manager to add your driver profile before registering" });
    }

    // Create user
    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role,
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Login User
const loginUser = async (req, res) => {
  try {
    const { email, password, role: requestedRole } = req.body;

    // Check required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Find user and include password
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+password");

    // Check user and password
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (requestedRole && requestedRole !== user.role && !(requestedRole === "fleetManager" && user.role === "admin")) {
      return res.status(403).json({ success: false, message: `This account is registered as ${user.role}` });
    }

    if (user.role === "driver" && !(await Driver.findOne({ email: user.email }))) {
      return res.status(403).json({ success: false, message: "No driver profile is linked to this account" });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!name || !email) return res.status(400).json({ success: false, message: "Name and email are required" });

    const duplicate = await User.findOne({ email, _id: { $ne: req.user._id } });
    if (duplicate) return res.status(409).json({ success: false, message: "That email is already in use" });
    if (req.user.role === "driver") {
      const driverConflict = await Driver.findOne({ email, _id: { $ne: req.driver._id } });
      if (driverConflict) return res.status(409).json({ success: false, message: "That email is already used by another driver" });
      await Driver.findByIdAndUpdate(req.driver._id, { name, email });
    }

    const oldEmail = req.user.email.toLowerCase();
    const user = await User.findByIdAndUpdate(req.user._id, { name, email }, {
      new: true, runValidators: true, select: "name email role createdAt updatedAt",
    });
    if (email !== oldEmail) {
      await Promise.all([
        Trip.updateMany({ customerEmail: oldEmail }, { customerEmail: email }),
        Notification.updateMany({ recipientEmail: oldEmail }, { recipientEmail: email }),
        Incident.updateMany({ reporterEmail: oldEmail }, { reporterEmail: email }),
      ]);
    }
    return res.json({ success: true, message: "Profile updated successfully", user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


// Export Authentication Functions
module.exports = {
  registerUser,
  loginUser,
  updateProfile,
};
