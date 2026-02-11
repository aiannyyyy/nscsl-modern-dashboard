const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notificationsController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Get unread count - BEFORE /:id routes
router.get('/unread-count', notificationsController.getUnreadCount);

// Mark all as read - BEFORE /:id routes
router.patch('/mark-all-read', notificationsController.markAllAsRead);

// Delete all notifications - BEFORE /:id routes
router.delete('/delete-all', notificationsController.deleteAllNotifications);

// Get all notifications for user's department - BEFORE /:id routes
router.get('/', notificationsController.getNotifications);

// Create new notification
router.post('/', notificationsController.createNotification);

// Mark notification as read - Parameterized route
router.patch('/:id/read', notificationsController.markAsRead);

// Delete notification - Parameterized route
router.delete('/:id', notificationsController.deleteNotification);

module.exports = router;