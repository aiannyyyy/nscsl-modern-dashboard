const express = require('express');
const router = express.Router();

const {
  getLabSupplies,
} = require('../../controllers/LaboratoryController/labSuppliesController');

// GET /api/laboratory/lab-supplies
router.get('/', getLabSupplies);

module.exports = router;
