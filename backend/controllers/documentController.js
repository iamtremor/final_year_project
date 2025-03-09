// backend/controllers/documentController.js
const Document = require('../models/Document');

// Upload document
const uploadDocument = async (req, res) => {
  try {
    // Document details from request
    const { title, description, documentType } = req.body;
    
    // Create new document
    const document = new Document({
      title,
      description,
      documentType,
      owner: req.user._id,
      status: 'pending'
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

// Update document status (for staff/admin)
const updateDocumentStatus = async (req, res) => {
  try {
    const { status, feedback } = req.body;
    
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    document.status = status;
    document.feedback = feedback;
    document.reviewedBy = req.user._id;
    document.reviewDate = Date.now();
    
    await document.save();
    
    res.json(document);
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

module.exports = {
  uploadDocument,
  getStudentDocuments,
  getDocumentById,
  updateDocumentStatus,
  getPendingDocuments,
  getAllDocuments
};