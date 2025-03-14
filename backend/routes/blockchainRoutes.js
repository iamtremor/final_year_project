const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const blockchainService = require('../services/blockchainService');
const auth = require('../middleware/auth');
const { checkRole, checkRoles } = require('../middleware/roles');
const Document = require('../models/Document');
const User = require('../models/User');
const config = require('../config');
// Storage setup for multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Blockchain service status check
router.get('/status', async (req, res) => {
  try {
    const isConnected = await blockchainService.isConnected();
    
    res.json({
      connected: isConnected,
      provider: blockchainService.provider ? blockchainService.provider.connection.url : 'Not configured',
      contractAddress: blockchainService.contract ? blockchainService.contract.address : 'Not configured'
    });
  } catch (error) {
    res.status(500).json({
      connected: false,
      error: error.message
    });
  }
});
// Get blockchain status for students only
router.get(
  '/students/status',
  auth,
  checkRole('admin'),
  async (req, res) => {
    try {
      console.log('Admin requesting blockchain student status');
      
      // Get all students from database
      const students = await User.find({ role: 'student' }).select('-password');
      console.log(`Found ${students.length} students in database`);
      
      // Check blockchain connection
      let blockchainConnected = false;
      try {
        blockchainConnected = await blockchainService.isConnected();
      } catch (connError) {
        console.error('Error checking blockchain connection:', connError);
      }
      
      // Calculate stats based on database records
      const stats = {
        total: students.length,
        registered: students.filter(s => s.blockchainRegistrationStatus === 'success').length,
        pending: students.filter(s => s.blockchainRegistrationStatus === 'pending').length,
        failed: students.filter(s => s.blockchainRegistrationStatus === 'failed').length
      };
      
      // If blockchain is not connected, just return DB stats
      if (!blockchainConnected) {
        return res.json({
          students,
          stats,
          blockchainConnected: false
        });
      }
      
      // Check blockchain for each student
      const studentsWithBlockchainData = await Promise.all(
        students.map(async (student) => {
          if (!student.applicationId) {
            return {
              ...student.toObject(),
              blockchainExists: false,
              blockchainVerified: false
            };
          }
          
          try {
            const blockchainStatus = await blockchainService.getStudentStatus(student.applicationId);
            
            // Convert mongoose document to plain object and add blockchain data
            const studentObj = student.toObject();
            studentObj.blockchainExists = blockchainStatus.exists;
            studentObj.blockchainVerified = blockchainStatus.verified;
            
            // If blockchain says registered but DB doesn't, update DB
            if (blockchainStatus.exists && student.blockchainRegistrationStatus !== 'success') {
              student.blockchainRegistrationStatus = 'success';
              student.blockchainTxHash = 'verified_from_blockchain';
              await student.save();
              console.log(`Updated student ${student.applicationId} based on blockchain data`);
            }
            
            return studentObj;
          } catch (error) {
            console.error(`Error getting blockchain status for student ${student.applicationId}:`, error);
            const studentObj = student.toObject();
            studentObj.blockchainError = error.message;
            return studentObj;
          }
        })
      );
      
      // Return enhanced data
      res.json({
        students: studentsWithBlockchainData,
        stats,
        blockchainConnected
      });
    } catch (error) {
      console.error('Error fetching students blockchain status:', error);
      res.status(500).json({ 
        message: 'Error fetching blockchain status',
        error: error.message
      });
    }
  }
);
// Register student on blockchain
router.post(
  '/students/register/:applicationId',
  auth,
  checkRole('admin'),
  async (req, res) => {
    try {
      const { applicationId } = req.params;
      
      // Find the student
      const student = await User.findOne({ applicationId, role: 'student' });
      
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      
      // Check if already registered on blockchain
      try {
        const blockchainStatus = await blockchainService.getStudentStatus(applicationId);
        
        if (blockchainStatus.exists) {
          // Update our database to reflect this if not already marked as successful
          if (student.blockchainRegistrationStatus !== 'success') {
            student.blockchainRegistrationStatus = 'success';
            student.blockchainTxHash = 'manual_verification_existing';
            await student.save();
          }
          
          return res.json({
            success: true,
            message: 'Student already registered on blockchain',
            alreadyRegistered: true
          });
        }
      } catch (checkError) {
        console.error('Error checking blockchain status:', checkError);
        // Continue with registration attempt
      }
      
      // Create student data object for blockchain
      const studentData = {
        fullName: student.fullName,
        email: student.email,
        applicationId: student.applicationId,
        registrationTimestamp: new Date().toISOString()
      };
      
      // Register on blockchain
      const blockchainResult = await blockchainService.registerStudent(applicationId, studentData);
      
      // Log action on blockchain
      await blockchainService.logAction(
        applicationId,
        "ACCOUNT_CREATED_MANUAL",
        `Student account created manually by admin: ${student.fullName} (${student.email})`
      );
      
      // Update student record
      student.blockchainTxHash = blockchainResult.transactionHash;
      student.blockchainBlockNumber = blockchainResult.blockNumber;
      student.blockchainRegistrationStatus = 'success';
      student.blockchainRegistrationAttempts = (student.blockchainRegistrationAttempts || 0) + 1;
      student.lastBlockchainRegistrationAttempt = Date.now();
      await student.save();
      
      res.json({
        success: true,
        message: 'Student registered on blockchain successfully',
        transaction: blockchainResult
      });
    } catch (error) {
      console.error('Error registering student on blockchain:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error registering student on blockchain',
        error: error.message
      });
    }
  }
);
// Add this to backend/routes/blockchainRoutes.js

// Verify student on blockchain
router.post(
  '/students/verify/:applicationId',
  auth,
  checkRole('admin'),
  async (req, res) => {
    try {
      const { applicationId } = req.params;
      
      // Find the student
      const student = await User.findOne({ applicationId, role: 'student' });
      
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      
      // Check if already registered on blockchain
      try {
        const blockchainStatus = await blockchainService.getStudentStatus(applicationId);
        
        if (!blockchainStatus.exists) {
          return res.status(400).json({ 
            message: 'Student must be registered on blockchain before verification',
            exists: false
          });
        }
        
        if (blockchainStatus.verified) {
          return res.json({
            success: true,
            message: 'Student is already verified on blockchain',
            alreadyVerified: true
          });
        }
      } catch (checkError) {
        console.error('Error checking blockchain status:', checkError);
        return res.status(500).json({
          message: 'Error checking blockchain status',
          error: checkError.message
        });
      }
      
      // Verify on blockchain
      const blockchainResult = await blockchainService.verifyStudent(applicationId);
      
      // Log action on blockchain
      await blockchainService.logAction(
        applicationId,
        "STUDENT_VERIFIED",
        `Student verified by admin: ${student.fullName} (${student.email})`
      );
      
      // Check if verification was successful
      const updatedStatus = await blockchainService.getStudentStatus(applicationId);
      
      res.json({
        success: true,
        verified: updatedStatus.verified,
        message: updatedStatus.verified
          ? 'Student verified on blockchain successfully'
          : 'Verification transaction sent, but verification status is still false',
        transaction: blockchainResult
      });
    } catch (error) {
      console.error('Error verifying student on blockchain:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error verifying student on blockchain',
        error: error.message
      });
    }
  }
);

// Verify all registered students on blockchain
router.post(
  '/students/verify-all',
  auth,
  checkRole('admin'),
  async (req, res) => {
    try {
      // Find all students with successful blockchain registration
      const registeredStudents = await User.find({
        role: 'student',
        blockchainRegistrationStatus: 'success'
      });
      
      const results = {
        total: registeredStudents.length,
        processed: 0,
        success: 0,
        alreadyVerified: 0,
        failed: 0,
        details: []
      };
      
      // Process each student
      for (const student of registeredStudents) {
        try {
          results.processed++;
          
          // Check if already verified
          const blockchainStatus = await blockchainService.getStudentStatus(student.applicationId);
          
          if (!blockchainStatus.exists) {
            results.failed++;
            results.details.push({
              applicationId: student.applicationId,
              success: false,
              reason: 'Student does not exist on blockchain'
            });
            continue;
          }
          
          if (blockchainStatus.verified) {
            results.alreadyVerified++;
            results.details.push({
              applicationId: student.applicationId,
              success: true,
              alreadyVerified: true
            });
            continue;
          }
          
          // Verify the student
          await blockchainService.verifyStudent(student.applicationId);
          
          // Log action
          await blockchainService.logAction(
            student.applicationId,
            "STUDENT_VERIFIED_BATCH",
            `Student verified in batch process: ${student.fullName}`
          );
          
          // Verify success
          const updatedStatus = await blockchainService.getStudentStatus(student.applicationId);
          
          if (updatedStatus.verified) {
            results.success++;
            results.details.push({
              applicationId: student.applicationId,
              success: true
            });
          } else {
            results.failed++;
            results.details.push({
              applicationId: student.applicationId,
              success: false,
              reason: 'Verification transaction sent but not reflected in blockchain'
            });
          }
        } catch (error) {
          console.error(`Error verifying student ${student.applicationId}:`, error);
          results.failed++;
          results.details.push({
            applicationId: student.applicationId,
            success: false,
            error: error.message
          });
        }
      }
      
      res.json({
        success: true,
        results
      });
    } catch (error) {
      console.error('Error in batch verification:', error);
      res.status(500).json({
        success: false,
        message: 'Error in batch verification',
        error: error.message
      });
    }
  }
);
router.get(
  '/student-documents/:applicationId',
  auth,
  async (req, res) => {
    try {
      const { applicationId } = req.params;
      
      // Check if this is the current user or an admin/staff
      const isAuthorized = 
        req.user.role === 'admin' || 
        req.user.role === 'staff' || 
        req.user.applicationId === applicationId;
      
      if (!isAuthorized) {
        return res.status(403).json({ message: 'Unauthorized to access these documents' });
      }
      
      // Find the user with this application ID
      const student = await User.findOne({ applicationId });
      
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      
      // Get only the approved documents from the database
      const approvedDocs = await Document.find({ 
        owner: student._id,
        status: 'approved',
        blockchainTxHash: { $exists: true, $ne: null } // Only documents that have been added to blockchain
      });
      
      // Format response
      const documents = approvedDocs.map(doc => ({
        id: doc._id,
        title: doc.title,
        documentType: doc.documentType,
        status: doc.status,
        documentHash: doc.documentHash,
        blockchainTxHash: doc.blockchainTxHash,
        blockchainBlockNumber: doc.blockchainBlockNumber,
        blockchainTimestamp: doc.blockchainTimestamp,
        reviewDate: doc.reviewDate
      }));
      
      res.json({
        applicationId,
        documents
      });
    } catch (error) {
      console.error('Error fetching student blockchain documents:', error);
      res.status(500).json({ message: 'Error fetching blockchain documents' });
    }
  }
);
// Manually register a staff member on blockchain
router.post(
  '/staff/register/:staffId',
  auth,
  checkRole('admin'),
  async (req, res) => {
    try {
      const { staffId } = req.params;
      
      // Find the staff member
      const staff = await User.findOne({ staffId, role: 'staff' });
      
      if (!staff) {
        return res.status(404).json({ message: 'Staff member not found' });
      }
      
      // Check if already registered on blockchain
      try {
        const blockchainStatus = await blockchainService.getUserStatus(staffId, 'staff');
        
        if (blockchainStatus.exists) {
          // Update our database to reflect this if not already marked as successful
          if (staff.blockchainRegistrationStatus !== 'success') {
            staff.blockchainRegistrationStatus = 'success';
            staff.blockchainTxHash = 'manual_verification_existing';
            await staff.save();
          }
          
          return res.json({
            success: true,
            message: 'Staff member already registered on blockchain',
            alreadyRegistered: true
          });
        }
      } catch (checkError) {
        console.error('Error checking blockchain status:', checkError);
        // Continue with registration attempt
      }
      
      // Create staff data object for blockchain
      const staffData = {
        fullName: staff.fullName,
        email: staff.email,
        staffId: staff.staffId,
        role: 'staff',
        registrationTimestamp: new Date().toISOString()
      };
      
      // Register on blockchain
      const blockchainResult = await blockchainService.registerStaff(staffId, staffData);
      
      // Log action on blockchain
      await blockchainService.logAction(
        `staff:${staffId}`,
        "STAFF_ACCOUNT_CREATED_MANUAL",
        `Staff account created manually by admin: ${staff.fullName} (${staff.email})`
      );
      
      // Update staff record
      staff.blockchainTxHash = blockchainResult.transactionHash;
      staff.blockchainBlockNumber = blockchainResult.blockNumber;
      staff.blockchainRegistrationStatus = 'success';
      staff.blockchainRegistrationAttempts = (staff.blockchainRegistrationAttempts || 0) + 1;
      staff.lastBlockchainRegistrationAttempt = Date.now();
      await staff.save();
      
      res.json({
        success: true,
        message: 'Staff member registered on blockchain successfully',
        transaction: blockchainResult
      });
    } catch (error) {
      console.error('Error registering staff on blockchain:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error registering staff on blockchain',
        error: error.message
      });
    }
  }
);

// Manually register an admin on blockchain
router.post(
  '/admin/register/:adminId',
  auth,
  checkRole('admin'),
  async (req, res) => {
    try {
      const { adminId } = req.params;
      
      // Find the admin
      const admin = await User.findOne({ adminId, role: 'admin' });
      
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }
      
      // Check if already registered on blockchain
      try {
        const blockchainStatus = await blockchainService.getUserStatus(adminId, 'admin');
        
        if (blockchainStatus.exists) {
          // Update our database to reflect this if not already marked as successful
          if (admin.blockchainRegistrationStatus !== 'success') {
            admin.blockchainRegistrationStatus = 'success';
            admin.blockchainTxHash = 'manual_verification_existing';
            await admin.save();
          }
          
          return res.json({
            success: true,
            message: 'Admin already registered on blockchain',
            alreadyRegistered: true
          });
        }
      } catch (checkError) {
        console.error('Error checking blockchain status:', checkError);
        // Continue with registration attempt
      }
      
      // Create admin data object for blockchain
      const adminData = {
        fullName: admin.fullName,
        email: admin.email,
        adminId: admin.adminId,
        role: 'admin',
        registrationTimestamp: new Date().toISOString()
      };
      
      // Register on blockchain
      const blockchainResult = await blockchainService.registerAdmin(adminId, adminData);
      
      // Log action on blockchain
      await blockchainService.logAction(
        `admin:${adminId}`,
        "ADMIN_ACCOUNT_CREATED_MANUAL",
        `Admin account created manually by admin: ${admin.fullName} (${admin.email})`
      );
      
      // Update admin record
      admin.blockchainTxHash = blockchainResult.transactionHash;
      admin.blockchainBlockNumber = blockchainResult.blockNumber;
      admin.blockchainRegistrationStatus = 'success';
      admin.blockchainRegistrationAttempts = (admin.blockchainRegistrationAttempts || 0) + 1;
      admin.lastBlockchainRegistrationAttempt = Date.now();
      await admin.save();
      
      res.json({
        success: true,
        message: 'Admin registered on blockchain successfully',
        transaction: blockchainResult
      });
    } catch (error) {
      console.error('Error registering admin on blockchain:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error registering admin on blockchain',
        error: error.message
      });
    }
  }
);
router.get(
  '/applications/within-deadline/:applicationId',
  auth,
  async (req, res) => {
    try {
      const { applicationId } = req.params;
      
      if (!applicationId) {
        return res.status(400).json({ 
          message: 'Application ID is required',
          isWithinDeadline: true // Default to true if no ID provided
        });
      }
      
      try {
        // Attempt to get deadline status from blockchain
        const result = await blockchainService.isWithinDeadline(applicationId);
        
        res.json({
          isWithinDeadline: result
        });
      } catch (blockchainError) {
        console.error('Blockchain deadline check error:', blockchainError);
        
        // In case of any blockchain errors, default to allowing submissions
        res.json({
          isWithinDeadline: true,
          error: 'Error checking blockchain deadline, defaulting to allow submissions',
          details: blockchainError.message
        });
      }
    } catch (error) {
      console.error('General error in deadline check endpoint:', error);
      
      // Always default to allowing submissions in case of errors
      res.json({ 
        isWithinDeadline: true,
        error: 'Error processing request, defaulting to allow submissions' 
      });
    }
  }
);
// Get blockchain status for all users (not just students)
router.get(
  '/users/status',
  auth,
  checkRole('admin'),
  async (req, res) => {
    try {
      console.log('Admin requesting blockchain user status');
      
      // Get all users from database
      const users = await User.find({}).select('-password');
      console.log(`Found ${users.length} users in database`);
      
      // Group users by role
      const students = users.filter(user => user.role === 'student');
      const staff = users.filter(user => user.role === 'staff');
      const admins = users.filter(user => user.role === 'admin');
      
      console.log(`Users breakdown: ${students.length} students, ${staff.length} staff, ${admins.length} admins`);
      
      // Check blockchain connection
      let blockchainConnected = false;
      try {
        blockchainConnected = await blockchainService.isConnected();
      } catch (connError) {
        console.error('Error checking blockchain connection:', connError);
      }
      
      // Calculate stats based on database records
      const stats = {
        total: users.length,
        registered: users.filter(u => u.blockchainRegistrationStatus === 'success').length,
        pending: users.filter(u => u.blockchainRegistrationStatus === 'pending').length,
        failed: users.filter(u => u.blockchainRegistrationStatus === 'failed').length,
        // Breakdown by role
        students: {
          total: students.length,
          registered: students.filter(s => s.blockchainRegistrationStatus === 'success').length,
          pending: students.filter(s => s.blockchainRegistrationStatus === 'pending').length,
          failed: students.filter(s => s.blockchainRegistrationStatus === 'failed').length
        },
        staff: {
          total: staff.length,
          registered: staff.filter(s => s.blockchainRegistrationStatus === 'success').length,
          pending: staff.filter(s => s.blockchainRegistrationStatus === 'pending').length,
          failed: staff.filter(s => s.blockchainRegistrationStatus === 'failed').length
        },
        admins: {
          total: admins.length,
          registered: admins.filter(a => a.blockchainRegistrationStatus === 'success').length,
          pending: admins.filter(a => a.blockchainRegistrationStatus === 'pending').length,
          failed: admins.filter(a => a.blockchainRegistrationStatus === 'failed').length
        }
      };
      
      // If blockchain is not connected, just return DB stats
      if (!blockchainConnected) {
        return res.json({
          users,
          stats,
          blockchainConnected: false
        });
      }
      
      // Check blockchain for each user
      const usersWithBlockchainData = await Promise.all(
        users.map(async (user) => {
          try {
            let blockchainId;
            let userRole = user.role;
            
            // Determine the blockchain ID based on user role
            if (userRole === 'student') {
              blockchainId = user.applicationId;
            } else if (userRole === 'staff') {
              blockchainId = user.staffId;
            } else if (userRole === 'admin') {
              blockchainId = user.adminId;
            } else {
              // Unknown role
              return {
                ...user.toObject(),
                blockchainExists: false,
                blockchainVerified: false,
                blockchainError: 'Unknown user role'
              };
            }
            
            // Skip if no ID is available
            if (!blockchainId) {
              return {
                ...user.toObject(),
                blockchainExists: false,
                blockchainVerified: false,
                blockchainError: 'No ID available'
              };
            }
            
            // Get blockchain status
            const blockchainStatus = await blockchainService.getUserStatus(blockchainId, userRole);
            
            // Convert mongoose document to plain object and add blockchain data
            const userObj = user.toObject();
            userObj.blockchainExists = blockchainStatus.exists;
            userObj.blockchainVerified = blockchainStatus.verified;
            
            // If blockchain says registered but DB doesn't, update DB
            if (blockchainStatus.exists && user.blockchainRegistrationStatus !== 'success') {
              user.blockchainRegistrationStatus = 'success';
              user.blockchainTxHash = 'verified_from_blockchain';
              await user.save();
              console.log(`Updated ${userRole} ${blockchainId} based on blockchain data`);
            }
            
            return userObj;
          } catch (error) {
            console.error(`Error getting blockchain status for user ${user._id}:`, error);
            const userObj = user.toObject();
            userObj.blockchainError = error.message;
            return userObj;
          }
        })
      );
      
      // Return enhanced data
      res.json({
        users: usersWithBlockchainData,
        stats,
        blockchainConnected
      });
    } catch (error) {
      console.error('Error fetching users blockchain status:', error);
      res.status(500).json({ 
        message: 'Error fetching blockchain status',
        error: error.message
      });
    }
  }
);

// Trigger the background job to register unregistered students
router.post(
  '/jobs/register-unregistered',
  auth,
  checkRole('admin'),
  async (req, res) => {
    try {
      const { scheduler } = require('../jobs/scheduler');
      const { registerUnregisteredStudents } = require('../jobs/blockchainRegistrationJob');
      
      // Run the job immediately
      const result = await scheduler.runJobNow('registerUnregisteredStudents', registerUnregisteredStudents);
      
      res.json({
        success: result.success,
        failure: result.failure,
        message: `Job completed: ${result.success} students registered, ${result.failure} failures`
      });
    } catch (error) {
      console.error('Error triggering registration job:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error triggering registration job',
        error: error.message
      });
    }
  }
);

// Trigger the combined job to register all unregistered users (students, staff, admins)
router.post(
  '/jobs/register-all-users',
  auth,
  checkRole('admin'),
  async (req, res) => {
    try {
      const { scheduler } = require('../jobs/scheduler');
      const { registerAllUnregisteredUsers } = require('../jobs/blockchainRegistrationJob');
      
      // Run the combined job immediately
      const result = await scheduler.runJobNow('registerAllUnregisteredUsers', registerAllUnregisteredUsers);
      
      res.json({
        success: true,
        students: result.students,
        staff: result.staff,
        admins: result.admins,
        totals: result.total,
        message: `Job completed: ${result.total.success} users registered successfully, ${result.total.failure} failures`
      });
    } catch (error) {
      console.error('Error triggering all users registration job:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error triggering registration job',
        error: error.message
      });
    }
  }
);

// Trigger job to register unregistered staff only
router.post(
  '/jobs/register-unregistered-staff',
  auth,
  checkRole('admin'),
  async (req, res) => {
    try {
      const { scheduler } = require('../jobs/scheduler');
      const { registerUnregisteredStaff } = require('../jobs/blockchainRegistrationJob');
      
      // Run the staff registration job immediately
      const result = await scheduler.runJobNow('registerUnregisteredStaff', registerUnregisteredStaff);
      
      res.json({
        success: true,
        registered: result.success,
        failed: result.failure,
        message: `Job completed: ${result.success} staff members registered, ${result.failure} failures`
      });
    } catch (error) {
      console.error('Error triggering staff registration job:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error triggering staff registration job',
        error: error.message
      });
    }
  }
);

// Trigger job to register unregistered admins only
router.post(
  '/jobs/register-unregistered-admins',
  auth,
  checkRole('admin'),
  async (req, res) => {
    try {
      const { scheduler } = require('../jobs/scheduler');
      const { registerUnregisteredAdmins } = require('../jobs/blockchainRegistrationJob');
      
      // Run the admin registration job immediately
      const result = await scheduler.runJobNow('registerUnregisteredAdmins', registerUnregisteredAdmins);
      
      res.json({
        success: true,
        registered: result.success,
        failed: result.failure,
        message: `Job completed: ${result.success} admins registered, ${result.failure} failures`
      });
    } catch (error) {
      console.error('Error triggering admin registration job:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error triggering admin registration job',
        error: error.message
      });
    }
  }
);
// Add to backend/routes/blockchainRoutes.js

// Student clearance verification
router.get(
  '/clearance/verify/:applicationId',
  auth,
  checkRoles(['staff', 'admin']),
  async (req, res) => {
    try {
      const { applicationId } = req.params;
      
      // Get all blockchain actions for this student
      const logs = await blockchainService.getStudentLogs(applicationId);
      
      // Check for clearance completion action
      const isCleared = logs.some(log => 
        log.action === "CLEARANCE_COMPLETED"
      );
      
      // Get form submissions and approvals
      const formSubmissions = logs.filter(log => 
        log.action === "FORM_SUBMITTED"
      );
      
      const formApprovals = logs.filter(log => 
        log.action === "FORM_APPROVED"
      );
      
      // Get document verifications
      const documentUploads = logs.filter(log => 
        log.action === "DOCUMENT_UPLOADED"
      );
      
      const documentApprovals = logs.filter(log => 
        log.action === "DOCUMENT_APPROVED"
      );
      
      res.json({
        applicationId,
        isCleared,
        formSubmissions,
        formApprovals,
        documentUploads,
        documentApprovals,
        allLogs: logs
      });
    } catch (error) {
      console.error('Error verifying clearance:', error);
      res.status(500).json({ 
        message: 'Error verifying clearance on blockchain',
        error: error.message
      });
    }
  }
);
// Diagnose blockchain connection and contract
router.get('/diagnose', async (req, res) => {
  try {
    const diagnosis = await blockchainService.diagnoseContract();
    res.json({
      connection: {
        provider: blockchainService.provider ? 
          blockchainService.provider.connection.url : 'Not configured',
        isConnected: await blockchainService.isConnected()
      },
      contract: {
        address: blockchainService.contract ? blockchainService.contract.address : 'Not configured',
        functions: diagnosis ? diagnosis.functions : []
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        blockchainUrl: process.env.BLOCKCHAIN_PROVIDER_URL || config.blockchain.providerUrl
      }
    });
  } catch (error) {
    console.error("Blockchain diagnostic error:", error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});
router.get('/test', (req, res) => {
  res.json({ message: 'Blockchain routes are working' });
});
module.exports = router;