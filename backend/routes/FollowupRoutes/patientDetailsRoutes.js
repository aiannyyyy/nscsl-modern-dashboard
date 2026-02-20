const express = require('express');
const router = express.Router();
const patientDetailsController = require('../../controllers/FollowupController/patientDetailsController');

/**
 * @route   GET /api/followup/patient-details
 * @desc    Get patient lab result details for follow-up
 * @access  Private
 *
 * Query Params:
 *   - dateFrom  (required) : Start date in YYYY-MM-DD format  e.g. 2024-01-01
 *   - dateTo    (required) : End date in YYYY-MM-DD format    e.g. 2024-01-31
 *   - testCode  (optional) : Filter by test code              e.g. OHP1 | default: ALL
 *
 * Example:
 *   GET /api/followup/patient-details?dateFrom=2024-01-01&dateTo=2024-01-31
 *   GET /api/followup/patient-details?dateFrom=2024-01-01&dateTo=2024-01-31&testCode=OHP1
 */
router.get('/patient-details', patientDetailsController.getPatientDetails);

/**
 * @route   GET /api/followup/patient-details/test-codes
 * @desc    Get list of all valid test code filter options
 * @access  Private
 *
 * Example:
 *   GET /api/followup/patient-details/test-codes
 */
router.get('/patient-details/test-codes', patientDetailsController.getTestCodes);

module.exports = router;