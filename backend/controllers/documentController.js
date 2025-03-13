// backend/controllers/documentController.js

const Document = require('../models/Document');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const blockchainService = require('../services/blockchainService');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', config.storage.documentsPath);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
console.log("Upload directory exists:", fs.existsSync(uploadDir));
try {
  // Test write permissions
  const testPath = path.join(uploadDir, "test.txt");
  fs.writeFileSync(testPath, "test");
  fs.unlinkSync(testPath);
  console.log("Upload directory is writable");
} catch (err) {
  console.error("Upload directory permission issue:", err);
}

// Upload document
const uploadDocument = async (req, res) => {
  try {
    // Document details from request
    const { title, description, documentType } = req.body;
    
    // Check if file was uploaded
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Generate unique filename
    const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    const filePath = path.join(uploadDir, fileName);
    
    // Save file to disk
    fs.writeFileSync(filePath, file.buffer);
    
    // Create new document
    const document = new Document({
      title,
      description,
      documentType,
      owner: req.user._id,
      status: 'pending',
      filePath: path.join(config.storage.documentsPath, fileName),
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      documentHash: blockchainService.createHash(file.buffer) // Store hash for future verification but don't add to blockchain yet
    });
    
    await document.save();
    
    res.status(201).json({ document });
  } catch (error) {
    console.error('Document upload error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get documents for current student
const getStudentDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ owner: req.user._id });
    res.json(documents);
  } catch (error) {
    console.error('Get documents error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get specific document by ID
const getDocumentById = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Check if user has permission to view this document
    if (
      document.owner.toString() !== req.user._id.toString() && 
      req.user.role !== 'staff' && 
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    res.json(document);
  } catch (error) {
    console.error('Get document error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Download document file
const downloadDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Check if user has permission to download this document
    if (
      document.owner.toString() !== req.user._id.toString() && 
      req.user.role !== 'staff' && 
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    const filePath = path.join(__dirname, '..', document.filePath);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }
    
    // Set response headers
    res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
    
    // Send file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Document download error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update document status (for staff/admin)
const updateDocumentStatus = async (req, res) => {
  try {
    const { status, feedback } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    if (status !== 'approved' && status !== 'rejected') {
      return res.status(400).json({ message: 'Status must be either "approved" or "rejected"' });
    }
    
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Update document status
    document.status = status;
    document.feedback = feedback || '';
    document.reviewedBy = req.user._id;
    document.reviewDate = Date.now();
    
    // If document is approved, register it on the blockchain
    if (status === 'approved') {
      try {
        // Get the student owner of the document
        const student = await User.findById(document.owner);
        
        if (!student || !student.applicationId) {
          return res.status(400).json({ message: 'Student information not found or incomplete' });
        }
        
        // Get file content for hash verification
        const filePath = path.join(__dirname, '..', document.filePath);
        if (!fs.existsSync(filePath)) {
          return res.status(404).json({ message: 'Document file not found on server' });
        }
        
        const fileContent = fs.readFileSync(filePath);
        
        // Check if student exists on blockchain, if not register them
        const studentStatus = await blockchainService.getStudentStatus(student.applicationId);
        
        if (!studentStatus.exists) {
          console.log(`Student ${student.applicationId} not found on blockchain, registering...`);
          await blockchainService.registerStudent(
            student.applicationId,
            {
              fullName: student.fullName,
              email: student.email,
              applicationId: student.applicationId
            }
          );
        }
        
        // Add document to blockchain
        console.log(`Adding approved document to blockchain for student ${student.applicationId}`);
        const blockchainResult = await blockchainService.addDocument(
          student.applicationId,
          document.documentType,
          fileContent
        );
        
        // Update document with blockchain information
        document.blockchainTxHash = blockchainResult.transactionHash;
        document.blockchainBlockNumber = blockchainResult.blockNumber;
        document.blockchainTimestamp = Date.now();
        
        console.log(`Document added to blockchain: ${blockchainResult.transactionHash}`);
      } catch (blockchainError) {
        console.error('Blockchain document registration error:', blockchainError);
        return res.status(500).json({ 
          message: 'Error registering document on blockchain',
          error: blockchainError.message
        });
      }
    }
    
    await document.save();
    
    res.json({
      message: `Document ${status} successfully`,
      document
    });
  } catch (error) {
    console.error('Update document error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all pending documents (for staff)
const getPendingDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ status: 'pending' })
      .populate('owner', 'fullName applicationId');
      
    res.json(documents);
  } catch (error) {
    console.error('Get pending documents error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all documents (for admin)
const getAllDocuments = async (req, res) => {
  try {
    const documents = await Document.find()
      .populate('owner', 'fullName applicationId')
      .populate('reviewedBy', 'fullName');
      
    res.json(documents);
  } catch (error) {
    console.error('Get all documents error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};
// Add this function to the documentController.js file

// Delete a document by ID
// Delete a document by ID - Updated for newer Mongoose versions
const deleteDocument = async (req, res) => {
  try {
    const documentId = req.params.id;
    
    // Find the document
    const document = await Document.findById(documentId);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Check if user has permission to delete this document
    if (document.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to delete this document' });
    }
    
    // Don't allow deletion of approved documents
    if (document.status === 'approved') {
      return res.status(400).json({ message: 'Cannot delete approved documents' });
    }
    
    // Delete the file from disk if it exists
    const filePath = path.join(__dirname, '..', document.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Delete the document from database using deleteOne() instead of remove()
    await Document.deleteOne({ _id: documentId });
    
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Document deletion error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add this to the exports at the bottom of the file:
// deleteDocument,
module.exports = {
  uploadDocument,
  getStudentDocuments,
  getDocumentById,
  downloadDocument,
  updateDocumentStatus,
  getPendingDocuments,
  getAllDocuments,
  deleteDocument // Add this to the exports
};