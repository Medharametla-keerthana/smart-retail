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

// ==========================================
// VEHICLE ROUTES
// ==========================================

// Create Vehicle
router.post("/", protect, createVehicle);

// Search and Filter Vehicles
// IMPORTANT: Keep this BEFORE /:id
router.get("/search", protect, searchVehicles);

// Get All Vehicles
router.get("/", protect, getAllVehicles);

// Get Vehicle by ID
router.get("/:id", protect, getVehicleById);

// Update Vehicle
router.put("/:id", protect, updateVehicle);

// Delete Vehicle
router.delete("/:id", protect, deleteVehicle);

// ==========================================
// EXPORT ROUTER
// ==========================================

module.exports = router;