const express = require("express");

const router = express.Router();

const {
  getDashboardSummary,
  getDashboardAnalytics,
} = require("../controllers/dashboardController");

const protect = require("../middleware/authMiddleware");

// Dashboard Summary
router.get("/summary", protect, getDashboardSummary);

// Dashboard Analytics
router.get("/analytics", protect, getDashboardAnalytics);

module.exports = router;