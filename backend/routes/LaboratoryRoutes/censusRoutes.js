const express = require('express');
const router = express.Router();
const censusController = require('../../controllers/LaboratoryController/censusController');

/**
 * @route   GET /api/laboratory/census/cumulative-monthly
 * @desc    Get cumulative monthly census samples
 * @query   type - 'Received' or 'Screened'
 * @access  Public/Private (add authentication middleware if needed)
 */
router.get('/cumulative-monthly', censusController.getCumulativeMonthlyCensus);

module.exports = router;