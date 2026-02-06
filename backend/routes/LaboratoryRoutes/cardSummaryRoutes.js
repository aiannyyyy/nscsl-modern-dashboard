const express = require('express');
const router = express.Router();
const cardSummaryController = require('../../controllers/LaboratoryController/cardSummaryController');

/**
 * @route   GET /api/laboratory/card-summary
 * @desc    Get laboratory summary card data (received, screened, unsatisfactory counts)
 * @access  Public (or add auth middleware if needed)
 */
router.get('/', cardSummaryController.getCardSummary);

module.exports = router;