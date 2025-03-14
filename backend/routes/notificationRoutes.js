// backend/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getStudentNotifications, 
  createNotification,
  toggleReadStatus,
  markAllRead,
  deleteNotification,
  clearAllNotifications
} = require('../controllers/notificationController');
const auth = require('../middleware/auth');
const { checkRole, checkRoles } = require('../middleware/roles');

// Get notifications for current student
router.get('/student', auth, checkRole('student'), getStudentNotifications);

// Create notification (staff/admin only)
router.post('/', auth, checkRoles(['staff', 'admin']), createNotification);

// Toggle notification read status
router.put('/:id/toggle-read', auth, toggleReadStatus);

// Mark all notifications as read
router.put('/mark-all-read', auth, markAllRead);

// Delete notification
router.delete('/:id', auth, deleteNotification);

// Clear all notifications
router.delete('/clear-all', auth, clearAllNotifications);

module.exports = router;