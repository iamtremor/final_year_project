const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  getUsers,
  getUsersByRole,
  updateUserProfile
} = require('../controllers/userController');
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/roles');

// Get current user profile - any authenticated user
router.get('/profile', auth, getUserProfile);

// Update user profile - any authenticated user
router.put('/profile', auth, updateUserProfile);

// Get all users - admin only
router.get('/', auth, checkRole('admin'), getUsers);

// Get users by role - admin only
router.get('/role/:role', auth, checkRole('admin'), getUsersByRole);

module.exports = router;
