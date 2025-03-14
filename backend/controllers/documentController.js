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
    
    const allowedDocumentTypes = [
      'Admission Letter', 
      'JAMB Result', 
      'JAMB Admission', 
      'WAEC', 
      'Birth Certificate', 
      'Payment Receipt', 
      'Medical Report', 
      'Passport',
      'Transcript'
    ];
    
    if (!allowedDocumentTypes.includes(documentType)) {
      return res.status(400).json({ message: 'Invalid document type' });
    }
    
    // Check if the student has an approved New Clearance Form
    const userId = req.user._id;
    const NewClearanceForm = require('../models/NewClearanceForm');
    const clearanceForm = await NewClearanceForm.findOne({ studentId: userId });
    
    if (!clearanceForm || !clearanceForm.deputyRegistrarApproved || !clearanceForm.schoolOfficerApproved) {
      return res.status(403).json({ 
        message: 'You need an approved New Clearance Form before uploading documents' 
      });
    }
    
    // Check if document already exists and is approved
    const existingDocument = await Document.findOne({ 
      owner: userId, 
      documentType 
    });
    
    if (existingDocument && existingDocument.status === 'approved') {
      return res.status(400).json({ 
        message: `A ${documentType} has already been approved for you` 
      });
    }
    
    // Set approver role based on document type
    let approverRole;
    switch(documentType) {
      case 'JAMB Result':
      case 'JAMB Admission':
      case 'WAEC':
        approverRole = 'schoolOfficer';
        break;
      case 'Admission Letter':
        approverRole = 'deputyRegistrar';
        break;
      case 'Birth Certificate':
      case 'Passport':
        approverRole = 'studentSupport';
        break;
      case 'Payment Receipt':
        approverRole = 'finance';
        break;
      case 'Medical Report':
        approverRole = 'health';
        break;
      case 'Transcript':
        approverRole = 'departmentHead';
        break;
      default:
        approverRole = 'admin';
    }
    
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
      documentHash: blockchainService.createHash(file.buffer), // Store hash for future verification but don't add to blockchain yet
      approverRole
    });
    
    await document.save();
    const User = require('../models/User'); // Make sure this is added at the top
    const Notification = require('../models/Notification'); // Make sure this is added at the top
    
    let staffDepartment;
    switch(approverRole) {
      case 'schoolOfficer':
        // Find school officer from student's department
        const student = await User.findById(userId);
        staffDepartment = student.department;
        break;
      case 'deputyRegistrar':
        staffDepartment = 'Registrar';
        break;
      case 'studentSupport':
        staffDepartment = 'Student Support';
        break;
      case 'finance':
        staffDepartment = 'Finance';
        break;
      case 'health':
        staffDepartment = 'Health Services';
        break;
      case 'departmentHead':
        // Find HOD from student's department
        const student2 = await User.findById(userId);
        staffDepartment = student2.department + ' HOD';
        break;
      default:
        staffDepartment = 'Admin';
    }
    
    // Find appropriate staff member
    const staff = await User.findOne({ 
      role: 'staff', 
      department: staffDepartment 
    });
    
    if (staff) {
      const notification = new Notification({
        title: 'New Document Uploaded',
        description: `A student has uploaded a ${documentType} that requires your review`,
        recipient: staff._id,
        status: 'info',
        type: 'document_upload',
        documentId: document._id,
        documentName: title
      });
      await notification.save();
    }
    
    res.status(201).json({ document });
  }
    catch (error) {
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
    const staffId = req.user._id;
    const documentId = req.params.id;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    if (status !== 'approved' && status !== 'rejected') {
      return res.status(400).json({ message: 'Status must be either "approved" or "rejected"' });
    }
    
    const document = await Document.findById(documentId);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Check if staff has authority to approve this document type
    if (req.user.role !== 'admin') {
      const canApprove = await canStaffApproveDocument(req.user, document);
      if (!canApprove) {
        return res.status(403).json({ 
          message: 'Unauthorized: You do not have permission to approve this document type' 
        });
      }
    }
    
    // Update document status
    document.status = status;
    document.feedback = feedback || '';
    document.reviewedBy = staffId;
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
        
        // Create notification for student about document approval
        const notification = new Notification({
          title: 'Document Approved',
          description: `Your ${document.documentType} has been approved.`,
          recipient: document.owner,
          status: 'success',
          type: 'document_approval',
          documentId: document._id,
          documentName: document.title
        });
        await notification.save();
        
        // Check if all documents are now complete and all forms are approved
        // This will trigger the final clearance process if everything is complete
        const clearanceComplete = await checkClearanceCompletion(document.owner);
        
        if (clearanceComplete) {
          // Create a special notification for student
          const completionNotification = new Notification({
            title: 'Clearance Process Completed',
            description: 'Congratulations! All your documents and forms have been approved. Your clearance process is now complete.',
            recipient: document.owner,
            status: 'success',
            type: 'clearance_complete'
          });
          await completionNotification.save();
        }
      } catch (blockchainError) {
        console.error('Blockchain document registration error:', blockchainError);
        return res.status(500).json({ 
          message: 'Error registering document on blockchain',
          error: blockchainError.message
        });
      }
    } else if (status === 'rejected') {
      // Create notification for student about document rejection
      const notification = new Notification({
        title: 'Document Rejected',
        description: `Your ${document.documentType} has been rejected. ${feedback ? 'Reason: ' + feedback : ''}`,
        recipient: document.owner,
        status: 'error',
        type: 'document_rejection',
        documentId: document._id,
        documentName: document.title
      });
      await notification.save();
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
/**
 * Helper function to check if a staff member can approve a document
 * @param {Object} staff - Staff user
 * @param {Object} document - Document to approve
 * @returns {boolean} - Whether the staff can approve this document
 */
const canStaffApproveDocument = async (staff, document) => {
  // If the document has a specific approverRole field, check against that
  if (document.approverRole) {
    switch (document.approverRole) {
      case 'schoolOfficer':
        // School officer can approve JAMB and WAEC documents
        return staff.department === (await User.findById(document.owner)).department;
      case 'deputyRegistrar':
        return staff.department === 'Registrar';
      case 'studentSupport':
        return staff.department === 'Student Support';
      case 'finance':
        return staff.department === 'Finance';
      case 'health':
        return staff.department === 'Health Services';
      case 'departmentHead':
        const studentDept = (await User.findById(document.owner)).department;
        return staff.department === `${studentDept} HOD`;
      default:
        return false;
    }
  }
  
  // If no specific approverRole, use document type to determine who can approve
  switch (document.documentType) {
    case 'JAMB Result':
    case 'JAMB Admission':
    case 'WAEC':
      // School officer can approve these
      const studentDept = (await User.findById(document.owner)).department;
      return staff.department === studentDept;
    case 'Admission Letter':
      return staff.department === 'Registrar';
    case 'Birth Certificate':
    case 'Passport':
      return staff.department === 'Student Support';
    case 'Payment Receipt':
      return staff.department === 'Finance';
    case 'Medical Report':
      return staff.department === 'Health Services';
    case 'Transcript':
      const studentDept2 = (await User.findById(document.owner)).department;
      return staff.department === `${studentDept2} HOD`;
    default:
      // Admin only for anything else
      return false;
  }
};

/**
 * Get documents that a staff member can approve
 * @route   GET /api/documents/staff/approvable
 * @access  Private (Staff only)
 */
const getApprovableDocuments = async (req, res) => {
  try {
    // Ensure this is a staff member
    if (req.user.role !== 'staff' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized: Staff only' });
    }
    
    let documents;
    
    if (req.user.role === 'admin') {
      // Admins can see all pending documents
      documents = await Document.find({ status: 'pending' })
        .populate('owner', 'fullName email applicationId department');
    } else {
      // For regular staff, filter by their approver role based on department
      let approverRoles = [];
      let departmentFilter = {};
      
      switch (req.user.department) {
        case 'Registrar':
          approverRoles.push('deputyRegistrar');
          departmentFilter = { documentType: 'Admission Letter' };
          break;
        case 'Student Support':
          approverRoles.push('studentSupport');
          departmentFilter = { 
            documentType: { $in: ['Birth Certificate', 'Passport'] } 
          };
          break;
        case 'Finance':
          approverRoles.push('finance');
          departmentFilter = { documentType: 'Payment Receipt' };
          break;
        case 'Health Services':
          approverRoles.push('health');
          departmentFilter = { documentType: 'Medical Report' };
          break;
        default:
          // For academic departments
          if (req.user.department.includes('HOD')) {
            approverRoles.push('departmentHead');
            departmentFilter = { documentType: 'Transcript' };
          } else {
            approverRoles.push('schoolOfficer');
            departmentFilter = { 
              documentType: { $in: ['JAMB Result', 'JAMB Admission', 'WAEC'] } 
            };
          }
      }
      
      // Find documents that this staff can approve
      documents = await Document.find({
        status: 'pending',
        $or: [
          { approverRole: { $in: approverRoles } },
          departmentFilter
        ]
      }).populate({
        path: 'owner',
        select: 'fullName email applicationId department',
        match: req.user.department.includes('HOD') || 
               !req.user.department.includes('Registrar') || 
               !req.user.department.includes('Student Support') || 
               !req.user.department.includes('Finance') || 
               !req.user.department.includes('Health Services') 
               ? { department: req.user.department.replace(' HOD', '') } 
               : {}
      });
      
      // Filter out null owners (those that didn't match the department)
      documents = documents.filter(doc => doc.owner !== null);
    }
    
    res.json(documents);
  } catch (error) {
    console.error('Error getting approvable documents:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get completed clearances for reporting
 * @route   GET /api/documents/clearance/completed
 * @access  Private (Admin only)
 */
const getCompletedClearances = async (req, res) => {
  try {
    // Ensure this is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized: Admin only' });
    }
    
    // Get all students
    const students = await User.find({ role: 'student' });
    
    // Array to store completed clearances
    const completedClearances = [];
    
    // Check each student's clearance status
    for (const student of students) {
      const clearanceStatus = await getStudentClearanceStatus(student._id);
      
      if (clearanceStatus.clearanceComplete) {
        completedClearances.push({
          student: {
            id: student._id,
            fullName: student.fullName,
            email: student.email,
            applicationId: student.applicationId,
            department: student.department
          },
          clearanceStatus
        });
      }
    }
    
    res.json(completedClearances);
  } catch (error) {
    console.error('Error getting completed clearances:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Helper function to get a student's clearance status
 * @param {string} studentId - Student's ID
 * @returns {Object} - Clearance status details
 */
const getStudentClearanceStatus = async (studentId) => {
  // Find all forms for this student
  const NewClearanceForm = require('../models/NewClearanceForm');
  const ProvAdmissionForm = require('../models/ProvAdmissionForm');
  const PersonalRecordForm = require('../models/PersonalRecordForm');
  const PersonalRecord2Form = require('../models/PersonalRecord2Form');
  const AffidavitForm = require('../models/AffidavitForm');
  
  const newClearanceForm = await NewClearanceForm.findOne({ studentId });
  const provAdmissionForm = await ProvAdmissionForm.findOne({ studentId });
  const personalRecordForm = await PersonalRecordForm.findOne({ studentId });
  const personalRecord2Form = await PersonalRecord2Form.findOne({ studentId });
  const affidavitForm = await AffidavitForm.findOne({ studentId });
  
  // Check document status
  const documents = await Document.find({ owner: studentId });
  const requiredDocumentTypes = [
    'Admission Letter', 'JAMB Result', 'JAMB Admission', 
    'WAEC', 'Birth Certificate', 'Payment Receipt', 
    'Medical Report', 'Passport'
  ];
  
  const documentStatus = {};
  requiredDocumentTypes.forEach(type => {
    const doc = documents.find(d => d.documentType === type);
    documentStatus[type] = {
      uploaded: !!doc,
      approved: doc ? doc.status === 'approved' : false,
      status: doc ? doc.status : 'not_uploaded',
      id: doc ? doc._id : null
    };
  });
  
  // Determine if new clearance form is fully approved
  const newClearanceApproved = newClearanceForm && 
    newClearanceForm.deputyRegistrarApproved && 
    newClearanceForm.schoolOfficerApproved;
  
  // Check if all forms and required documents are approved
  const allFormsSubmitted = newClearanceForm && provAdmissionForm && 
    personalRecordForm && personalRecord2Form && affidavitForm &&
    provAdmissionForm.submitted && personalRecordForm.submitted &&
    personalRecord2Form.submitted && affidavitForm.submitted;
  
  const allFormsApproved = newClearanceApproved &&
    (provAdmissionForm && provAdmissionForm.approved) &&
    (personalRecordForm && personalRecordForm.approved) &&
    (personalRecord2Form && personalRecord2Form.approved) &&
    (affidavitForm && affidavitForm.approved);
  
  const allDocumentsApproved = requiredDocumentTypes.every(type => 
    documentStatus[type].approved
  );
  
  const clearanceComplete = allFormsSubmitted && allFormsApproved && allDocumentsApproved;
  
  return {
    forms: {
      newClearance: {
        submitted: !!newClearanceForm,
        deputyRegistrarApproved: newClearanceForm ? newClearanceForm.deputyRegistrarApproved : false,
        schoolOfficerApproved: newClearanceForm ? newClearanceForm.schoolOfficerApproved : false,
        approved: newClearanceApproved
      },
      provAdmission: {
        submitted: provAdmissionForm ? provAdmissionForm.submitted : false,
        approved: provAdmissionForm ? provAdmissionForm.approved : false
      },
      personalRecord: {
        submitted: personalRecordForm ? personalRecordForm.submitted : false,
        approved: personalRecordForm ? personalRecordForm.approved : false
      },
      personalRecord2: {
        submitted: personalRecord2Form ? personalRecord2Form.submitted : false,
        approved: personalRecord2Form ? personalRecord2Form.approved : false
      },
      affidavit: {
        submitted: affidavitForm ? affidavitForm.submitted : false,
        approved: affidavitForm ? affidavitForm.approved : false
      }
    },
    documents: documentStatus,
    allFormsSubmitted,
    allFormsApproved,
    allDocumentsApproved,
    clearanceComplete
  };
};

/**
 * Helper function to check if a student's clearance process is complete
 * Imported from clearanceController for document approval events
 */
const checkClearanceCompletion = async (studentId) => {
  const clearanceStatus = await getStudentClearanceStatus(studentId);
  
  if (clearanceStatus.clearanceComplete) {
    // Find the student
    const student = await User.findById(studentId);
    
    if (student && student.applicationId) {
      // Record completion on blockchain
      try {
        const blockchainResult = await blockchainService.completeClearanceProcess(
          student.applicationId
        );
        
        console.log(`Clearance process completed on blockchain: ${blockchainResult.transactionHash}`);
        return true;
      } catch (error) {
        console.error('Error recording clearance completion:', error);
      }
    }
  }
  
  return false;
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
  getApprovableDocuments,
  getCompletedClearances,
  getStudentClearanceStatus,
  checkClearanceCompletion,
  canStaffApproveDocument,
  deleteDocument // Add this to the exports
};