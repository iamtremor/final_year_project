 const User = require('../models/User');
const { generateToken } = require('../utils/tokenUtils');

// @desc    Register student
// @route   POST /api/auth/student/register
// @access  Public
const registerStudent = async (req, res) => {
  try {
    const { fullName, email, password, applicationId } = req.body;
    
    // Validate required fields
    if (!fullName || !email || !password || !applicationId) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Check if student already exists by application ID
    let user = await User.findOne({ applicationId, role: 'student' });
    if (user) {
      return res.status(400).json({ message: 'Student with this Application ID already exists' });
    }
    
    // Check if email is already in use
    user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'Email is already in use' });
    }
    
    // Create new student
    user = new User({
      fullName,
      email,
      password,
      applicationId,
      role: 'student'
    });
    
    await user.save();
    
    // Generate JWT token
    const token = generateToken(user._id, user.role);
    
    // Return user data and token
    res.status(201).json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        applicationId: user.applicationId,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Student registration error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Register staff
// @route   POST /api/auth/staff/register
// @access  Public
const registerStaff = async (req, res) => {
  try {
    const { fullName, email, password, staffId } = req.body;
    
    // Validate required fields
    if (!fullName || !email || !password || !staffId) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Check if staff already exists by staff ID
    let user = await User.findOne({ staffId, role: 'staff' });
    if (user) {
      return res.status(400).json({ message: 'Staff with this Staff ID already exists' });
    }
    
    // Check if email is already in use
    user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'Email is already in use' });
    }
    
    // Create new staff
    user = new User({
      fullName,
      email,
      password,
      staffId,
      role: 'staff'
    });
    
    await user.save();
    
    // Generate JWT token
    const token = generateToken(user._id, user.role);
    
    // Return user data and token
    res.status(201).json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        staffId: user.staffId,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Staff registration error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Register admin
// @route   POST /api/auth/admin/register
// @access  Public
const registerAdmin = async (req, res) => {
  try {
    const { fullName, email, password, adminId } = req.body;
    
    // Validate required fields
    if (!fullName || !email || !password || !adminId) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Check if admin already exists by admin ID
    let user = await User.findOne({ adminId, role: 'admin' });
    if (user) {
      return res.status(400).json({ message: 'Admin with this Admin ID already exists' });
    }
    
    // Check if email is already in use
    user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'Email is already in use' });
    }
    
    // Create new admin
    user = new User({
      fullName,
      email,
      password,
      adminId,
      role: 'admin'
    });
    
    await user.save();
    
    // Generate JWT token
    const token = generateToken(user._id, user.role);
    
    // Return user data and token
    res.status(201).json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        adminId: user.adminId,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Admin registration error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Login student
// @route   POST /api/auth/student/login
// @access  Public
const loginStudent = async (req, res) => {
  try {
    const { applicationId, password } = req.body;
    
    // Validate required fields
    if (!applicationId || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Find student by application ID
    const user = await User.findOne({ applicationId, role: 'student' });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = generateToken(user._id, user.role);
    
    // Return user data and token
    res.json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        applicationId: user.applicationId,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Student login error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Login staff
// @route   POST /api/auth/staff/login
// @access  Public
const loginStaff = async (req, res) => {
  try {
    const { staffId, password } = req.body;
    
    // Validate required fields
    if (!staffId || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Find staff by staff ID
    const user = await User.findOne({ staffId, role: 'staff' });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = generateToken(user._id, user.role);
    
    // Return user data and token
    res.json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        staffId: user.staffId,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Staff login error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Login admin
// @route   POST /api/auth/admin/login
// @access  Public
const loginAdmin = async (req, res) => {
  try {
    const { adminId, password } = req.body;
    
    // Validate required fields
    if (!adminId || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Find admin by admin ID
    const user = await User.findOne({ adminId, role: 'admin' });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = generateToken(user._id, user.role);
    
    // Return user data and token
    res.json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        adminId: user.adminId,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Admin login error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  registerStudent,
  registerStaff,
  registerAdmin,
  loginStudent,
  loginStaff,
  loginAdmin
};
