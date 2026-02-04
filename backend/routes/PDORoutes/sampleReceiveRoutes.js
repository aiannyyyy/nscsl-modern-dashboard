const express = require("express");
const router = express.Router();
const sampleReceiveController = require("../../controllers/PDOController/sampleReceiveController");

/**
 * @route   GET /api/sample-receive/monthly-labno-count
 * @desc    Get monthly lab number count for a specific province
 * @access  Private (add authentication middleware if needed)
 * @params  query: { from, to, province, type }
 */
router.get("/monthly-labno-count", sampleReceiveController.getMonthlyLabNoCount);

/**
 * @route   GET /api/sample-receive/cumulative-all-province
 * @desc    Get cumulative data for all provinces (BATANGAS, LAGUNA, CAVITE, RIZAL, QUEZON)
 * @access  Private (add authentication middleware if needed)
 * @params  query: { from, to, type }
 */
router.get("/cumulative-all-province", sampleReceiveController.getCumulativeAllProvince);

module.exports = router;