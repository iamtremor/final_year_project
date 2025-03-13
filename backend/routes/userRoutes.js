const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  getUsers,
  getUsersByRole,
  getUsersWithBlockchainStatus,
  updateUserProfile,
  deleteUser
} = require('../controllers/userController');
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/roles');

// Get current user profile - any authenticated user
router.get('/profile', auth, getUserProfile);

// Update user profile - any authenticated user
router.put('/profile', auth, updateUserProfile);

// Get all users - admin only
router.get('/', auth, checkRole('admin'), getUsers);

// Get all users with blockchain status - admin only
router.get('/with-blockchain', auth, checkRole('admin'), getUsersWithBlockchainStatus);

// Get users by role - admin only
router.get('/role/:role', auth, checkRole('admin'), getUsersByRole);

// Delete a user - admin only
router.delete('/:id', auth, checkRole('admin'), deleteUser);

module.exports = router;