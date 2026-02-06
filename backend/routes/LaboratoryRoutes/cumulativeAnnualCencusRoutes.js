const express = require('express');
const router = express.Router();
const { getCumulativeAnnualCensus } = require('../../controllers/LaboratoryController/cumulativeAnnualCencusController');

/**
 * @route   GET /api/laboratory/cumulative-annual-census
 * @desc    Get cumulative annual census samples with test_6 and enbs breakdown
 * @access  Private (add authentication middleware if needed)
 */
router.get('/', getCumulativeAnnualCensus);

module.exports = router;