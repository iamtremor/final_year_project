const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const blockchainService = require('../services/blockchainService');
const auth = require('../middleware/auth');
const { checkRole, checkRoles } = require('../middleware/roles');
const Document = require('../models/Document');
const User = require('../models/User');

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

// Register student on blockchain
router.post(
  '/students/register',
  auth,
  checkRole('admin'),
  async (req, res) => {
    try {
      const { applicationId, studentData } = req.body;
      
      if (!applicationId || !studentData) {
        return res.status(400).json({ message: 'Application ID and student data are required' });
      }
      
      const result = await blockchainService.registerStudent(applicationId, studentData);
      
      res.status(201).json({
        message: 'Student registered on blockchain',
        transaction: result
      });
    } catch (error) {
      console.error('Blockchain student registration error:', error);
      res.status(500).json({ message: 'Error registering student on blockchain' });
    }
  }
);

// Verify student on blockchain
router.post(
  '/students/verify/:applicationId',
  auth,
  checkRole('staff'),
  async (req, res) => {
    try {
      const { applicationId } = req.params;
      
      const result = await blockchainService.verifyStudent(applicationId);
      
      res.json({
        message: 'Student verified on blockchain',
        transaction: result
      });
    } catch (error) {
      console.error('Blockchain student verification error:', error);
      res.status(500).json({ message: 'Error verifying student on blockchain' });
    }
  }
);

// This endpoint is no longer used directly - documents are only added when approved by staff
// Kept for backward compatibility
router.post(
  '/documents/upload',
  auth,
  upload.single('file'),
  async (req, res) => {
    return res.status(400).json({ 
      message: 'Documents are now only added to the blockchain after approval by staff'
    });
  }
);

// Review document on blockchain
router.post(
  '/documents/review',
  auth,
  checkRole('staff'),
  async (req, res) => {
    try {
      const { applicationId, documentType, status, rejectionReason } = req.body;
      
      if (!applicationId || !documentType || !status) {
        return res.status(400).json({ message: 'Application ID, document type, and status are required' });
      }
      
      if (status === 'rejected' && !rejectionReason) {
        return res.status(400).json({ message: 'Rejection reason is required for rejected documents' });
      }
      
      const result = await blockchainService.reviewDocument(
        applicationId,
        documentType,
        status,
        rejectionReason || ''
      );
      
      res.json({
        message: `Document ${status} on blockchain`,
        transaction: result
      });
    } catch (error) {
      console.error('Blockchain document review error:', error);
      res.status(500).json({ message: 'Error reviewing document on blockchain' });
    }
  }
);

// Update application status on blockchain
router.post(
  '/applications/status',
  auth,
  checkRole('staff'),
  async (req, res) => {
    try {
      const { applicationId, status } = req.body;
      
      if (!applicationId || !status) {
        return res.status(400).json({ message: 'Application ID and status are required' });
      }
      
      const result = await blockchainService.updateApplicationStatus(applicationId, status);
      
      res.json({
        message: 'Application status updated on blockchain',
        transaction: result
      });
    } catch (error) {
      console.error('Blockchain application status update error:', error);
      res.status(500).json({ message: 'Error updating application status on blockchain' });
    }
  }
);

// Set deadline on blockchain
router.post(
  '/applications/deadline',
  auth,
  checkRole('admin'),
  async (req, res) => {
    try {
      const { applicationId, deadline } = req.body;
      
      if (!applicationId || !deadline) {
        return res.status(400).json({ message: 'Application ID and deadline are required' });
      }
      
      const deadlineDate = new Date(deadline);
      
      if (isNaN(deadlineDate.getTime())) {
        return res.status(400).json({ message: 'Invalid deadline date' });
      }
      
      const result = await blockchainService.setDeadline(applicationId, deadlineDate);
      
      res.json({
        message: 'Deadline set on blockchain',
        transaction: result
      });
    } catch (error) {
      console.error('Blockchain deadline setting error:', error);
      res.status(500).json({ message: 'Error setting deadline on blockchain' });
    }
  }
);

// Check if within deadline
// Check if within deadline
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
// Get blockchain status for all students
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
// Get student status from blockchain
router.get(
  '/students/:applicationId',
  auth,
  async (req, res) => {
    try {
      const { applicationId } = req.params;
      
      const result = await blockchainService.getStudentStatus(applicationId);
      
      res.json(result);
    } catch (error) {
      console.error('Blockchain student status check error:', error);
      res.status(500).json({ message: 'Error getting student status from blockchain' });
    }
  }
);

// Verify document integrity against blockchain
router.post(
  '/documents/verify-integrity',
  auth,
  upload.single('file'),
  async (req, res) => {
    try {
      const { applicationId, documentType } = req.body;
      const file = req.file;
      
      if (!applicationId || !documentType || !file) {
        return res.status(400).json({ message: 'Application ID, document type, and file are required' });
      }
      
      const result = await blockchainService.verifyDocumentIntegrity(
        applicationId,
        documentType,
        file.buffer
      );
      
      res.json(result);
    } catch (error) {
      console.error('Blockchain document integrity check error:', error);
      res.status(500).json({ message: 'Error verifying document integrity' });
    }
  }
);

// Get blockchain-verified documents for a student
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

// Add isConnected method to blockchainService if it doesn't exist
if (!blockchainService.isConnected) {
  blockchainService.isConnected = async function() {
    try {
      if (this.provider) {
        const network = await this.provider.getNetwork();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Network connectivity check failed:', error.message);
      return false;
    }
  };
}
//shows all the functions in the smart contract
// router.get('/diagnose', async (req, res) => {
//   try {
//     const diagnosis = await blockchainService.diagnoseContract();
//     res.json(diagnosis);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// Add these routes to your blockchainRoutes.js file

// Get blockchain status for all students
// Add this to your blockchainRoutes.js file, replacing the existing students/status route


// Manually register a student on blockchain
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
)
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
module.exports = router;