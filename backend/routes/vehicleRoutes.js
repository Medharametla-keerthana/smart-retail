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
const { getMaintenance, scheduleMaintenance, updateMaintenance } = require("../controllers/maintenanceController");

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
router.get("/maintenance", protect, authorize("fleetManager"), getMaintenance);
router.post("/maintenance", protect, authorize("fleetManager"), scheduleMaintenance);
router.put("/maintenance/:id", protect, authorize("fleetManager"), updateMaintenance);

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
