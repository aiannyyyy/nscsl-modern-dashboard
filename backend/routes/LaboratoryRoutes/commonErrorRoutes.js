const express = require('express');
const router = express.Router();
const commonErrorController = require('../../controllers/LaboratoryController/commonErrorController');

/**
 * @route   GET /api/common-errors
 * @desc    Get common errors summary by table column and technician
 * @query   year - Year (e.g., 2024)
 * @query   month - Month (1-12)
 * @example /api/common-errors?year=2024&month=1
 */
router.get('/', commonErrorController.getCommonErrors);

/**
 * @route   GET /api/common-errors/breakdown
 * @desc    Get detailed breakdown of errors for a specific table column
 * @query   year - Year (e.g., 2024)
 * @query   month - Month (1-12)
 * @query   tableColumn - Table column name (e.g., 'FNAME', 'LNAME', 'BIRTHDT')
 * @example /api/common-errors/breakdown?year=2024&month=1&tableColumn=FNAME
 */
router.get('/breakdown', commonErrorController.getCommonErrorBreakdown);

module.exports = router;