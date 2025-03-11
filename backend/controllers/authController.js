const User = require('../models/User');
const { generateToken } = require('../utils/tokenUtils');
const blockchainService = require('../services/blockchainService'); // Add this import

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
    
    // Register student on blockchain - only creating a record, not documents
    try {
      // Create a hash of student data for blockchain storage
      const studentData = {
        fullName,
        email,
        applicationId,
        registrationTimestamp: new Date().toISOString()
      };
      
      console.log(`Registering student ${applicationId} on blockchain...`);
      // Call blockchain service to register the student
      const blockchainResult = await blockchainService.registerStudent(applicationId, studentData);
      console.log(`Student ${applicationId} registered on blockchain successfully`, blockchainResult);
      
      // Also log this account creation event on the blockchain
      await blockchainService.logAction(
        applicationId,
        "ACCOUNT_CREATED",
        `Student account created: ${fullName} (${email})`
      );
      
      // Store blockchain transaction details with user
      user.blockchainTxHash = blockchainResult.transactionHash;
      user.blockchainBlockNumber = blockchainResult.blockNumber;
      await user.save();
    } catch (blockchainError) {
      console.error('Blockchain registration error:', blockchainError);
      // We continue with the response, not failing if blockchain has issues
    }
    
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
        role: user.role,
        blockchainRegistered: !!user.blockchainTxHash
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
    
    // Log staff account creation on blockchain
    try {
      const staffData = {
        fullName,
        email,
        staffId,
        role: 'staff',
        registrationTimestamp: new Date().toISOString()
      };
      
      // Log this account creation event on the blockchain
      // Using staffId as the key (like applicationId for students)
      await blockchainService.logAction(
        staffId,
        "STAFF_ACCOUNT_CREATED",
        `Staff account created: ${fullName} (${email})`
      );
    } catch (blockchainError) {
      console.error('Blockchain staff registration error:', blockchainError);
      // Continue with the response, not failing if blockchain has issues
    }
    
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
    
    // Log admin account creation on blockchain
    try {
      // Log this account creation event on the blockchain
      // Using adminId as the key
      await blockchainService.logAction(
        adminId,
        "ADMIN_ACCOUNT_CREATED",
        `Admin account created: ${fullName} (${email})`
      );
    } catch (blockchainError) {
      console.error('Blockchain admin registration error:', blockchainError);
      // Continue with the response, not failing if blockchain has issues
    }
    
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
        role: user.role,
        blockchainRegistered: !!user.blockchainTxHash
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