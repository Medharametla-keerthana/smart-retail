const express = require("express");

const router = express.Router();

const {
  updateVehicleLocation,
  getCurrentLocation,
  getLocationHistory,
} = require("../controllers/locationController");

const protect = require("../middleware/authMiddleware");


// Update Vehicle Location
router.put("/:vehicleId", protect, updateVehicleLocation);

// Get Current Location
router.get("/:vehicleId/current", protect, getCurrentLocation);

// Get Location History
router.get("/:vehicleId/history", protect, getLocationHistory);


module.exports = router;