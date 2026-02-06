const express = require('express');
const router = express.Router();
const labTotalDailySamplesController = require('../../controllers/LaboratoryController/labTotalDailySamplesController');

/**
 * @route   GET /api/laboratory/total-daily-samples
 * @desc    Get laboratory total daily samples for a specific month/year
 * @query   year - Year (e.g., 2024)
 * @query   month - Month name (e.g., 'January')
 * @query   sampleType - Optional: 'received' or 'screened' (default: 'received')
 * @access  Public (or add auth middleware if needed)
 */
router.get('/', labTotalDailySamplesController.getLabTotalDailySamples);

module.exports = router;