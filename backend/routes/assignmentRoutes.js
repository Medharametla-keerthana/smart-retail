const express = require("express");

const router = express.Router();

const {
  assignDriverToVehicle,
  removeDriverAssignment,
  getAssignmentDetails,
} = require("../controllers/assignmentController");

const protect = require("../middleware/authMiddleware");

// ==========================================
// ASSIGN DRIVER TO VEHICLE
// ==========================================

router.put("/assign", protect, assignDriverToVehicle);

// ==========================================
// REMOVE DRIVER FROM VEHICLE
// ==========================================

router.put("/remove", protect, removeDriverAssignment);

// ==========================================
// GET ASSIGNMENT DETAILS
// ==========================================

router.get("/:vehicleId", protect, getAssignmentDetails);

module.exports = router;