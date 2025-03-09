// backend/routes/blockchainRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const blockchainService = require('../services/blockchainService');
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/roles');
const Document = require('../models/Document'); // Ensure this path is correct

// Set up multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Add this to your blockchainRoutes.js
router.get('/test', (req, res) => {
  res.json({
    message: 'Blockchain service is loaded',
    providerConfigured: !!blockchainService.provider,
    contractConfigured: !!blockchainService.contract,
    contractAddress: blockchainService.contract ? blockchainService.contract.address : 'Not set'
  });
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

// Upload document to blockchain
// In blockchainRoutes.js
router.post(
  '/documents/upload',
  auth,
  upload.single('file'),
  async (req, res) => {
    try {
      console.log("Upload request received:", req.body);
      console.log("File received:", req.file ? req.file.originalname : "No file");
      
      const { applicationId, documentType } = req.body;
      const file = req.file;
      
      if (!applicationId || !documentType || !file) {
        return res.status(400).json({ 
          message: 'Application ID, document type, and file are required'
        });
      }
      
      console.log("Preparing to add document to blockchain...");
      console.log("- Application ID:", applicationId);
      console.log("- Document Type:", documentType);
      console.log("- File Size:", file.size, "bytes");
      
      // Create explicit buffer from file
      const fileBuffer = file.buffer;
      
      console.log("Calling blockchain service addDocument method...");
      const result = await blockchainService.addDocument(
        applicationId,
        documentType,
        fileBuffer
      );
      
      console.log("Blockchain transaction result:", result);
      
      res.status(201).json({
        message: 'Document uploaded to blockchain',
        documentHash: result.documentHash,
        transaction: result
      });
    } catch (error) {
      console.error('Blockchain document upload error:', error);
      res.status(500).json({ 
        message: 'Error uploading document to blockchain',
        error: error.message
      });
    }
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
// In blockchainRoutes.js
router.get('/test-transaction', async (req, res) => {
  try {
    console.log("Testing blockchain transaction...");
    
    // Get network info to check connection
    const network = await blockchainService.provider.getNetwork();
    console.log("Connected to network:", network);
    
    // Get the contract address
    const contractAddress = blockchainService.contract.address;
    console.log("Contract address:", contractAddress);
    
    // Try a simple write operation
    const tx = await blockchainService.contract.registerStudent("TEST124", "0x1234567890");
    console.log("Transaction hash:", tx.hash);
    
    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt.blockNumber);
    
    res.status(200).json({
      success: true,
      network: {
        name: network.name,
        chainId: network.chainId
      },
      contractAddress: contractAddress,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber
    });
  } catch (error) {
    console.error("Blockchain test error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});
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

// Verify document integrity
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
// Add this to your blockchainRoutes.js
router.get('/register-test-student', async (req, res) => {
  try {
    const applicationId = req.query.id || "140456"; // Use your actual student ID
    console.log("Registering student:", applicationId);
    
    const tx = await blockchainService.registerStudent(
      applicationId, 
      // Student data hash - can be anything for testing
      "0x" + require('crypto').createHash('sha256').update(JSON.stringify({name: "Test Student"})).digest('hex')
    );
    
    console.log("Transaction hash:", tx.transactionHash);
    
    res.status(200).json({
      success: true,
      message: `Student ${applicationId} registered on blockchain`,
      transaction: tx
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


// Add these endpoints to your blockchainRoutes.js file

/**
 * Get all documents for a student from the blockchain
 */
router.get(
  '/student-documents/:applicationId',
  auth,
  async (req, res) => {
    try {
      const { applicationId } = req.params;
      
      // Check if this is the current user or an admin/staff
      if (req.user.role !== 'admin' && req.user.role !== 'staff' && req.user.applicationId !== applicationId) {
        return res.status(403).json({ message: 'Unauthorized to access these documents' });
      }
      
      console.log(`Fetching blockchain documents for student: ${applicationId}`);
      
      // Get all document types from your database for this student
      const documentTypes = await Document.find({ 
        owner: req.user._id 
      }).distinct('documentType');
      
      const documents = [];
      
      // For each document type, get the blockchain status
      for (const docType of documentTypes) {
        try {
          const blockchainDoc = await blockchainService.getDocumentStatus(applicationId, docType);
          
          if (blockchainDoc && blockchainDoc.exists) {
            // Find the matching document in your database to get additional info
            const dbDoc = await Document.findOne({ 
              owner: req.user._id,
              documentType: docType
            });
            
            documents.push({
              id: dbDoc ? dbDoc._id : undefined,
              title: dbDoc ? dbDoc.title : docType,
              documentType: docType,
              documentHash: blockchainDoc.documentHash,
              status: blockchainDoc.status,
              uploadTime: blockchainDoc.uploadTime?.toNumber(),
              reviewTime: blockchainDoc.reviewTime?.toNumber(),
              blockNumber: blockchainDoc.blockNumber,
              transactionHash: blockchainDoc.transactionHash
            });
          }
        } catch (error) {
          console.error(`Error fetching blockchain status for document type ${docType}:`, error);
          // Continue with next document type
        }
      }
      
      res.json({
        applicationId,
        documents
      });
    } catch (error) {
      console.error('Error fetching student documents from blockchain:', error);
      res.status(500).json({ message: 'Error fetching blockchain documents' });
    }
  }
);

/**
 * Get document file for verification
 */
router.get(
  '/documents/:id/file',
  auth,
  async (req, res) => {
    try {
      const document = await Document.findById(req.params.id);
      
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      // Check if this is the document owner or an admin/staff
      if (document.owner.toString() !== req.user._id.toString() && 
          req.user.role !== 'admin' && req.user.role !== 'staff') {
        return res.status(403).json({ message: 'Unauthorized to access this document' });
      }
      
      // Fetch the actual file from your storage system
      // This implementation will depend on how you're storing files
      
      // Example for files stored in filesystem:
      const filePath = path.join(__dirname, '..', 'uploads', document.filePath);
      res.sendFile(filePath);
      
      // Example for files stored in database:
      // res.set('Content-Type', document.mimeType);
      // res.send(document.fileData);
    } catch (error) {
      console.error('Error fetching document file:', error);
      res.status(500).json({ message: 'Error fetching document file' });
    }
  }
);
module.exports = router;