const express = require("express");
const router = express.Router();
const unsatController = require("../controllers/unsatController");

router.get("/top-unsatisfactory", unsatController.topUnsatisfactory);
router.get("/details-unsatisfactory", unsatController.detailsUnsatisfactory);
router.get("/total-samples", unsatController.totalSamples);
router.get("/unsat-rate", unsatController.unsatRate);
router.get("/full-patient", unsatController.fullPatient);
router.get("/unsat-province", unsatController.unsatProvince);

module.exports = router;
