const express = require("express");

const router = express.Router();

const {
  createTrip,
  requestTrip,
  assignTripResources,
  getAllTrips,
  getTripById,
  updateTripStatus,
  cancelTrip,
  searchTrips,
} = require("../controllers/tripController");

const protect = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/authMiddleware");

// ==========================================
// TRIP ROUTES
// ==========================================

// Create Trip
router.post("/", protect, authorize("fleetManager"), createTrip);
router.post("/request", protect, authorize("customer"), requestTrip);
router.put("/:id/assignment", protect, authorize("fleetManager"), assignTripResources);

// Search and Filter Trips
router.get("/search", protect, searchTrips);

// Get All Trips
router.get("/", protect, getAllTrips);

// Update Trip Status
router.put("/status", protect, authorize("fleetManager", "driver"), updateTripStatus);
router.put("/:id/status", protect, authorize("fleetManager", "driver"), updateTripStatus);

// Cancel Trip
router.put("/:id/cancel", protect, authorize("fleetManager"), cancelTrip);

// Get Single Trip
router.get("/:id", protect, getTripById);

module.exports = router;
