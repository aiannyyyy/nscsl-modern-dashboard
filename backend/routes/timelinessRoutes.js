const express = require('express');
const router = express.Router();
const timelinessController = require('../controllers/timelinessController');

router.get('/', timelinessController.getTimelinessData);

module.exports = router;
