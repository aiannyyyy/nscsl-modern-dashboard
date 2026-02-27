const express = require('express');
const router = express.Router();
const userController = require('../../controllers/LaboratoryController/userController');

// Since server already has '/api/users'
// DO NOT repeat '/users' here

// GET /api/users/
router.get('/:userID', userController.displayUsers);

module.exports = router;