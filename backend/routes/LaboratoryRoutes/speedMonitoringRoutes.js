const express = require("express");
const router = express.Router();
const speedMonitoringController = require("../../controllers/LaboratoryController/speedMonitroingController");

/**
 * @route   GET /api/speed-monitoring
 * @desc    Get speed monitoring data for entry or verification
 * @access  Public (or add authentication middleware as needed)
 * @query   year - Year (e.g., "2025")
 * @query   month - Month (e.g., "1" or "01")
 * @query   type - Type ("entry" or "verification")
 * @example /api/speed-monitoring?year=2025&month=2&type=entry
 */
router.get("/", speedMonitoringController.getSpeedMonitoring);

module.exports = router;