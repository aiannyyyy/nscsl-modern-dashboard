const express = require('express');
const router = express.Router();
const ytdSampleComparisonController = require('../../controllers/LaboratoryController/ytdSampleComparisonController');

/**
 * @route   GET /api/laboratory/ytd-sample-comparison
 * @desc    Get YTD sample comparison for two years
 * @query   year1 - First year (e.g., 2024)
 * @query   year2 - Second year (e.g., 2025)
 * @query   type - Sample type: 'received' or 'screened'
 * @access  Public (or add auth middleware if needed)
 */
router.get('/', ytdSampleComparisonController.getYTDSampleComparison);

module.exports = router;