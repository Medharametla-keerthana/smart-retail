const express = require("express");

const router = express.Router();

const {
  createTrip,
  getAllTrips,
  getTripById,
  updateTripStatus,
  cancelTrip,
  searchTrips,
} = require("../controllers/tripController");

const protect = require("../middleware/authMiddleware");

// ==========================================
// TRIP ROUTES
// ==========================================

// Create Trip
router.post("/", protect, createTrip);

// Search and Filter Trips
router.get("/search", protect, searchTrips);

// Get All Trips
router.get("/", protect, getAllTrips);

// Update Trip Status
router.put("/:id/status", protect, updateTripStatus);

// Cancel Trip
router.put("/:id/cancel", protect, cancelTrip);

// Get Single Trip
router.get("/:id", protect, getTripById);

module.exports = router;