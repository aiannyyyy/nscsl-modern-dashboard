const express = require('express');
const router  = express.Router();
const pisController = require('../../controllers/LaboratoryController/pisController');

/**
 * PIS Routes — Patient Information System
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * GET /api/laboratory/pis/search
 *   Search patients across SAMPLE_DEMOG_ARCHIVE + SAMPLE_DEMOG_MASTER
 *   Query parameters (all optional, at least one required):
 *     labno, labid, lname, fname, submid, phyid, sex,
 *     outsideLab, formno, birthdt, dtcoll, dtrecv, dtrptd
 *
 * GET /api/laboratory/pis/detail/:labno
 *   Full patient detail for a single Lab No
 *   Joins:
 *     PHMSDS.SAMPLE_DEMOG_ARCHIVE  — specimen / demographic data
 *     PHMSDS.REF_PROVIDER_ADDRESS  — facility / provider info
 *     PHCMS.CASE_DEMOG_ARCHIVE     — disposition / case info
 *   Response includes resolved names:
 *     INIT_TECH_NAME, VER_TECH_NAME, CLOSED_BY_NAME
 *
 * Examples:
 *   GET /api/laboratory/pis/search?labno=20250020001
 *   GET /api/laboratory/pis/search?lname=flores&sex=F
 *   GET /api/laboratory/pis/search?dtrecv=2026-01-02&sex=1
 *   GET /api/laboratory/pis/detail/20260350259
 */

router.get('/search',  pisController.searchPatients);
router.get('/detail',  pisController.getPatientDetail);
router.get('/results',     pisController.getPatientResults);
router.get('/testsequence',  pisController.getTestSequence);
router.get('/filtercards',   pisController.getPatientFilterCards);

module.exports = router;