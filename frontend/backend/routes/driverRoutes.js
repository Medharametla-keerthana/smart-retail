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
const { authorize } = require("../middleware/authMiddleware");

// ==========================================
// DRIVER ROUTES
// ==========================================

// Create Driver
router.post("/", protect, authorize("fleetManager"), createDriver);

// Search and Filter Drivers
// Example:
// GET /api/drivers/search?search=John
// GET /api/drivers/search?status=Available
// GET /api/drivers/search?search=John&status=Available
router.get("/search", protect, authorize("fleetManager"), searchDrivers);

// Get All Drivers
router.get("/", protect, authorize("fleetManager"), getDrivers);

// Get Single Driver
router.get("/:id", protect, authorize("fleetManager"), getDriverById);

// Update Driver
router.put("/:id", protect, authorize("fleetManager"), updateDriver);

// Delete Driver
router.delete("/:id", protect, authorize("fleetManager"), deleteDriver);

module.exports = router;
