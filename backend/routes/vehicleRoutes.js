const express = require("express");

const router = express.Router();

// ==========================================
// IMPORT CONTROLLERS
// ==========================================

const {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  searchVehicles,
} = require("../controllers/vehicleController");

// ==========================================
// AUTHENTICATION MIDDLEWARE
// ==========================================

const protect = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/authMiddleware");

// ==========================================
// VEHICLE ROUTES
// ==========================================

// Create Vehicle
router.post("/", protect, authorize("fleetManager"), createVehicle);

// Search and Filter Vehicles
// IMPORTANT: Keep this BEFORE /:id
router.get("/search", protect, authorize("fleetManager"), searchVehicles);

// Get All Vehicles
router.get("/", protect, authorize("fleetManager", "driver"), getAllVehicles);

// Get Vehicle by ID
router.get("/:id", protect, authorize("fleetManager", "driver"), getVehicleById);

// Update Vehicle
router.put("/:id", protect, authorize("fleetManager"), updateVehicle);

// Delete Vehicle
router.delete("/:id", protect, authorize("fleetManager"), deleteVehicle);

// ==========================================
// EXPORT ROUTER
// ==========================================

module.exports = router;
