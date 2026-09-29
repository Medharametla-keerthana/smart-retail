const express = require("express");

const router = express.Router();

const {
  createDriver,
  getDrivers,
  getDriverById,
  updateDriver,
  deleteDriver,
  searchDrivers,
} = require("../controllers/driverController");

const protect = require("../middleware/authMiddleware");

// ==========================================
// DRIVER ROUTES
// ==========================================

// Create Driver
router.post("/", protect, createDriver);

// Search and Filter Drivers
// Example:
// GET /api/drivers/search?search=John
// GET /api/drivers/search?status=Available
// GET /api/drivers/search?search=John&status=Available
router.get("/search", protect, searchDrivers);

// Get All Drivers
router.get("/", protect, getDrivers);

// Get Single Driver
router.get("/:id", protect, getDriverById);

// Update Driver
router.put("/:id", protect, updateDriver);

// Delete Driver
router.delete("/:id", protect, deleteDriver);

module.exports = router;