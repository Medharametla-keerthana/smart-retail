const express = require("express");

const router = express.Router();

const {
  getDashboardSummary,
  getDashboardAnalytics,
} = require("../controllers/dashboardController");

const protect = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/authMiddleware");

// Dashboard Summary
router.get("/summary", protect, authorize("fleetManager", "driver", "customer"), getDashboardSummary);

// Dashboard Analytics
router.get("/analytics", protect, authorize("fleetManager"), getDashboardAnalytics);

module.exports = router;
