// backend/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getStudentNotifications, 
  createNotification,
  toggleReadStatus,
  markAllRead,
  deleteNotification,
  clearAllNotifications,
  getUserNotifications,
  getUnreadCount
} = require('../controllers/notificationController');
const auth = require('../middleware/auth');
const { checkRole, checkRoles } = require('../middleware/roles');

// Specific routes first
router.get('/user', auth, getUserNotifications);
router.get('/unread-count', auth, getUnreadCount);
router.put('/mark-all-read', auth, markAllRead);
router.delete('/clear-all', auth, clearAllNotifications);

// Parameterized routes last
router.delete('/:id', auth, deleteNotification);
router.put('/:id/toggle-read', auth, toggleReadStatus);
// Create notification (staff/admin only)
router.post('/', auth, checkRoles(['staff', 'admin']), createNotification);

module.exports = router;