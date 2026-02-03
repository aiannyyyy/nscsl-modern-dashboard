const express = require('express');
const router = express.Router();
const { upload } = require('../config');
const facilityVisitsController = require('../controllers/facilityVisitsController');

// Facility lookup by code (Oracle) - MUST BE FIRST
router.get('/lookup-facility', facilityVisitsController.getFacilityByCode);

// Get facility status count (for chart) - BEFORE /:id routes
router.get('/facility-status-count', facilityVisitsController.getStatusCount);

// Get facilities by status - BEFORE /:id routes
router.get('/facilities-by-status/:status', facilityVisitsController.getFacilitiesByStatus);

// Get all facility visits - BEFORE /:id routes
router.get('/', facilityVisitsController.getAllVisits);

// Create new facility visit with file upload
router.post('/', upload.array('attachments'), facilityVisitsController.createVisit);

// Update facility visit with file management - Parameterized route
router.put('/:id', upload.array('attachments'), facilityVisitsController.updateVisit);

// Delete facility visit - Parameterized route
router.delete('/:id', facilityVisitsController.deleteVisit);

// Update status only - Parameterized route
router.patch('/:id/status', facilityVisitsController.updateStatus);

module.exports = router;