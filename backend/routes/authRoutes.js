// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.post('/login', authController.login);
router.post('/register', authController.register); // Optional - can be protected later

// Protected routes
router.post('/logout', authMiddleware, authController.logout);
router.get('/verify', authMiddleware, authController.verify);
router.get('/me', authMiddleware, authController.getCurrentUser);

module.exports = router;