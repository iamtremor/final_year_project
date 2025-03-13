const User = require('../models/User');
const blockchainService = require('../services/blockchainService');

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
// Updated getUserProfile function in userController.js

const getUserProfile = async (req, res) => {
  try {
    // User is already available from auth middleware
    const user = req.user;
    
    // Prepare response based on user role
    const responseData = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    };
    
    // Add role-specific fields
    if (user.role === 'student') {
      responseData.applicationId = user.applicationId;
      responseData.phoneNumber = user.phoneNumber;
      responseData.department = user.department;
      responseData.dateOfBirth = user.dateOfBirth;
      
      // Add blockchain status if available
      if (user.blockchainRegistrationStatus) {
        responseData.blockchainRegistrationStatus = user.blockchainRegistrationStatus;
      }
    } else if (user.role === 'staff') {
      responseData.staffId = user.staffId;
    } else if (user.role === 'admin') {
      responseData.adminId = user.adminId;
    }
    
    // Return user data
    res.json(responseData);
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
// Updated updateUserProfile function in userController.js

const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update basic fields that are sent in the request
    if (req.body.fullName) user.fullName = req.body.fullName;
    if (req.body.email) user.email = req.body.email;
    if (req.body.password) user.password = req.body.password;
    
    // Update student specific fields if user is a student
    if (user.role === 'student') {
      if (req.body.phoneNumber) user.phoneNumber = req.body.phoneNumber;
      if (req.body.department) user.department = req.body.department;
      if (req.body.dateOfBirth) user.dateOfBirth = new Date(req.body.dateOfBirth);
    }
    
    // Save updated user
    const updatedUser = await user.save();
    
    // Prepare response based on user role
    const responseData = {
      id: updatedUser._id,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      role: updatedUser.role
    };
    
    // Add role-specific fields to response
    if (updatedUser.role === 'student') {
      responseData.applicationId = updatedUser.applicationId;
      responseData.phoneNumber = updatedUser.phoneNumber;
      responseData.department = updatedUser.department;
      responseData.dateOfBirth = updatedUser.dateOfBirth;
    } else if (updatedUser.role === 'staff') {
      responseData.staffId = updatedUser.staffId;
    } else if (updatedUser.role === 'admin') {
      responseData.adminId = updatedUser.adminId;
    }
    
    res.json(responseData);
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