const express = require('express');
const router  = express.Router();
const pisController = require('../../controllers/LaboratoryController/pisController');

/**
 * PIS Routes — Patient Information System
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * GET /api/laboratory/pis/search        — Search patients
 * GET /api/laboratory/pis/detail        — Full patient detail by labno
 * GET /api/laboratory/pis/results       — Lab results for a labno
 * GET /api/laboratory/pis/testsequence  — Test sequence / analytes
 * GET /api/laboratory/pis/filtercards   — All labnos for same patient (fname+lname)
 * GET /api/laboratory/pis/image         — Specimen scan image file
 * GET /api/laboratory/pis/audit-trail   — Audit trail (AUDIT_RESULTS + AUDIT_SAMPLE)
 * GET /api/laboratory/pis/notes         — Sample notes (SAMPLE_NOTES_ARCHIVE + USERS)
 */

router.get('/search',       pisController.searchPatients);
router.get('/detail',       pisController.getPatientDetail);
router.get('/results',      pisController.getPatientResults);
router.get('/testsequence', pisController.getTestSequence);
router.get('/filtercards',  pisController.getPatientFilterCards);
router.get('/image',        pisController.fetchImage);
router.get('/audit-trail',  pisController.getAuditTrail);
router.get('/notes',        pisController.getNotes);

module.exports = router;