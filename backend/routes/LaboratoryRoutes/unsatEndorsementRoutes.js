const express = require('express');
const router = express.Router();
const endorsementController = require('../../controllers/LaboratoryController/unsatEndorsementController');
const upload = require('../../config/multer');

/**
 * GET /api/endorsements/lookup/:labno
 * Lookup lab number from Oracle database
 */
router.get('/lookup/:labno', endorsementController.lookupLabNumber);

/**
 * GET /api/endorsements
 * Get all endorsements
 */
router.get('/', endorsementController.getAllEndorsements);

/**
 * GET /api/endorsements/:id
 * Get endorsement by ID
 */
router.get('/:id', endorsementController.getEndorsementById);

/**
 * GET /api/endorsements/labno/:labno
 * Get endorsements by lab number
 */
router.get('/labno/:labno', endorsementController.getEndorsementsByLabNo);

/**
 * GET /api/endorsements/facility/:facility_code
 * Get endorsements by facility code
 */
router.get('/facility/:facility_code', endorsementController.getEndorsementsByFacility);

/**
 * GET /api/endorsements/status/:status
 * Get endorsements by status (with optional date filtering)
 */
router.get('/status/:status', endorsementController.getEndorsementsByStatus);

/**
 * GET /api/endorsements/stats/summary
 * Get endorsement statistics
 */
router.get('/stats/summary', endorsementController.getEndorsementStats);

/**
 * GET /api/endorsements/test-results/unique
 * Get unique test results for dropdown filter
 */
router.get('/test-results/unique', endorsementController.getUniqueTestResults);

/**
 * POST /api/endorsements
 * Create new endorsement (with file upload support)
 */
router.post('/', upload.array('attachments', 5), endorsementController.createEndorsement);

/**
 * PUT /api/endorsements/:id
 * Update endorsement (with file upload support)
 */
router.put('/:id', upload.array('attachments', 5), endorsementController.updateEndorsement);

/**
 * PATCH /api/endorsements/:id/status
 * Update endorsement status only
 */
router.patch('/:id/status', endorsementController.updateEndorsementStatus);

/**
 * DELETE /api/endorsements/:id
 * Delete endorsement
 */
router.delete('/:id', endorsementController.deleteEndorsement);

module.exports = router;