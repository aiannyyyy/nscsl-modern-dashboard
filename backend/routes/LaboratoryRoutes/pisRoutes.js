const express = require('express');
const router = express.Router();
const pisController = require('../../controllers/LaboratoryController/pisController');

/**
 * PIS Routes — Patient Information System
 *
 * GET /api/laboratory/pis/search
 *
 * Query parameters (all optional, at least one required):
 *   labno       — exact match
 *   labid       — exact match
 *   lname       — partial match (LIKE)
 *   fname       — partial match (LIKE)
 *   submid      — exact match
 *   phyid       — exact match
 *   sex         — exact match  (1 | 2 | A | M | F)
 *   outsideLab  — exact match  (1–6)
 *   formno      — exact match
 *   birthdt     — date  YYYY-MM-DD
 *   dtcoll      — date  YYYY-MM-DD
 *   dtrecv      — date  YYYY-MM-DD
 *   dtrptd      — date  YYYY-MM-DD
 *
 * Example:
 *   GET /api/laboratory/pis/search?labno=20250020001
 *   GET /api/laboratory/pis/search?lname=flores&sex=F
 *   GET /api/laboratory/pis/search?dtrecv=2026-01-02&sex=1
 */
router.get('/search', pisController.searchPatients);

module.exports = router;