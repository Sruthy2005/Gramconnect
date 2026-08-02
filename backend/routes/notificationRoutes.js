const express = require('express');
const router = express.Router();
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications,
  streamNotifications,
  simulateNotification
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

// Real-time stream (SSE)
router.get('/stream', streamNotifications);

// Retrieve notifications
router.get('/', protect, getNotifications);
router.get('/unread-count', protect, getUnreadCount);

// Mark read
router.patch('/read-all', protect, markAllAsRead);
router.patch('/:id/read', protect, markAsRead);

// Dismiss/Delete
router.delete('/delete-read', protect, deleteReadNotifications);
router.delete('/:id', protect, deleteNotification);

// Simulate notification (for testing all 23 types easily)
router.post('/simulate', protect, simulateNotification);

module.exports = router;
