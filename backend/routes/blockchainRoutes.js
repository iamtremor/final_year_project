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
router.get(
  '/applications/within-deadline/:applicationId',
  auth,
  async (req, res) => {
    try {
      const { applicationId } = req.params;
      
      const result = await blockchainService.isWithinDeadline(applicationId);
      
      res.json({
        isWithinDeadline: result
      });
    } catch (error) {
      console.error('Blockchain deadline check error:', error);
      res.status(500).json({ message: 'Error checking deadline on blockchain' });
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
router.get('/diagnose', async (req, res) => {
  try {
    const diagnosis = await blockchainService.diagnoseContract();
    res.json(diagnosis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;