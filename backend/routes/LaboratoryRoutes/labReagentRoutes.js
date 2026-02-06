const express = require('express');
const router = express.Router();

const {
  getLabReagents,
} = require('../../controllers/LaboratoryController/labReagentsController');

// GET /api/laboratory/lab-reagents
router.get('/', getLabReagents);

module.exports = router;