const express = require("express");
const router = express.Router();
const dataEntryController = require('../../controllers/LaboratoryController/demogSummaryCardsController');

// Get current month data entry statistics
// GET /api/data-entry-stats
router.get("/", dataEntryController.getDataEntryStats);

// Get data entry statistics by custom date range
// GET /api/data-entry-stats/date-range?startDate=2024-01-01&endDate=2024-01-31
router.get("/date-range", dataEntryController.getDataEntryStatsByDateRange);

module.exports = router;