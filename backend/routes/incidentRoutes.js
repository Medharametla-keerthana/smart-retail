const express = require("express");
const { getIncidents, reportIncident, resolveIncident } = require("../controllers/incidentController");
const protect = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/authMiddleware");

const router = express.Router();
router.get("/", protect, authorize("fleetManager", "driver", "customer"), getIncidents);
router.post("/", protect, authorize("driver"), reportIncident);
router.put("/resolve", protect, authorize("fleetManager"), resolveIncident);
router.put("/:id/resolve", protect, authorize("fleetManager"), resolveIncident);
module.exports = router;
