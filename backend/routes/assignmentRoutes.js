const express = require("express");

const router = express.Router();

const {
  assignDriverToVehicle,
  removeDriverAssignment,
  getAssignmentDetails,
} = require("../controllers/assignmentController");

const protect = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/authMiddleware");

// ==========================================
// ASSIGN DRIVER TO VEHICLE
// ==========================================

router.put("/assign", protect, authorize("fleetManager"), assignDriverToVehicle);

// ==========================================
// REMOVE DRIVER FROM VEHICLE
// ==========================================

router.put("/remove", protect, authorize("fleetManager"), removeDriverAssignment);

// ==========================================
// GET ASSIGNMENT DETAILS
// ==========================================

router.get("/:vehicleId", protect, authorize("fleetManager"), getAssignmentDetails);

module.exports = router;
