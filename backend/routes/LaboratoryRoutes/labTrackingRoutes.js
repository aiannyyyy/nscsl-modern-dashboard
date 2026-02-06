const express = require('express');
const router = express.Router();
const labTrackingController = require('../../controllers/LaboratoryController/labTrackingController');

/**
 * @route   GET /api/laboratory/tracking-stats
 * @desc    Get lab tracking statistics (average, median, mode)
 * @query   year - Year (e.g., 2025)
 * @query   month - Month (1-12)
 * @access  Public (or add auth middleware if needed)
 */
router.get('/', labTrackingController.getLabTrackingStats);

module.exports = router;