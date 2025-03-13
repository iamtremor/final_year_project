const User = require('../models/User');
const blockchainService = require('../services/blockchainService');

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    // User is already available from auth middleware
    const user = req.user;
    
    // Return user data without password
    res.json({
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      applicationId: user.applicationId,
      staffId: user.staffId,
      adminId: user.adminId
    });
  } catch (error) {
    console.error('Get user profile error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    // Get all users, exclude passwords
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get users by role
// @route   GET /api/users/role/:role
// @access  Private/Admin
const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;
    
    // Validate role
    if (!['student', 'staff', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }
    
    // Get users by role, exclude passwords
    const users = await User.find({ role }).select('-password');
    res.json(users);
  } catch (error) {
    console.error('Get users by role error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all users with blockchain status
// @route   GET /api/users/with-blockchain
// @access  Private/Admin
const getUsersWithBlockchainStatus = async (req, res) => {
  try {
    // Get all users from database
    const users = await User.find({}).select('-password');
    
    // For each student, check blockchain status
    const enhancedUsers = await Promise.all(users.map(async (user) => {
      // Only check blockchain status for students
      if (user.role === 'student' && user.applicationId) {
        try {
          const blockchainStatus = await blockchainService.getStudentStatus(user.applicationId);
          
          // Add blockchain status to user object
          return {
            ...user.toObject(),
            blockchainExists: blockchainStatus.exists,
            blockchainVerified: blockchainStatus.verified,
            blockchainRegistrationTime: blockchainStatus.registrationTime
          };
        } catch (error) {
          console.error(`Error getting blockchain status for ${user.applicationId}:`, error);
          return user.toObject();
        }
      }
      return user.toObject();
    }));
    
    res.json(enhancedUsers);
  } catch (error) {
    console.error('Get users with blockchain status error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update fields that are sent in the request
    if (req.body.fullName) user.fullName = req.body.fullName;
    if (req.body.email) user.email = req.body.email;
    if (req.body.password) user.password = req.body.password;
    
    // Save updated user
    const updatedUser = await user.save();
    
    res.json({
      id: updatedUser._id,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      role: updatedUser.role,
      applicationId: updatedUser.applicationId,
      staffId: updatedUser.staffId,
      adminId: updatedUser.adminId
    });
  } catch (error) {
    console.error('Update user profile error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await user.remove();
    
    res.json({ message: 'User removed' });
  } catch (error) {
    console.error('Delete user error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getUserProfile,
  getUsers,
  getUsersByRole,
  getUsersWithBlockchainStatus,
  updateUserProfile,
  deleteUser
};