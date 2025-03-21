// backend/controllers/documentController.js

const Document = require('../models/Document');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const blockchainService = require('../services/blockchainService');
const Notification = require('../models/Notification');
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
      documentHash: blockchainService.createHash(file.buffer), // Store hash for future verification
      approverRole
    });
    
    await document.save();
    
    // Find appropriate staff to notify
    let staffToNotify = null;
    const User = require('../models/User');
    const Notification = require('../models/Notification');
    
    // Get student for department info
    const student = await User.findById(userId);
    
    // Log for debugging
    console.log('Document upload notification process:', {
      documentType,
      approverRole,
      studentDept: student ? student.department : 'Unknown'
    });
    
    switch(approverRole) {
      case 'schoolOfficer':
        // For School Officer, find officers who manage the student's department
        staffToNotify = await User.findOne({ 
          role: 'staff', 
          department: 'School Officer',
          managedDepartments: { $in: [student.department] }
        });
        
        console.log('School Officer notification:', {
          studentDepartment: student.department,
          foundOfficer: !!staffToNotify,
          officerDetails: staffToNotify ? {
            id: staffToNotify._id,
            name: staffToNotify.fullName,
            managedDepts: staffToNotify.managedDepartments
          } : 'None found'
        });
        break;
        
      case 'deputyRegistrar':
        staffToNotify = await User.findOne({ role: 'staff', department: 'Registrar' });
        break;
        
      case 'studentSupport':
        staffToNotify = await User.findOne({ role: 'staff', department: 'Student Support' });
        break;
        
      case 'finance':
        staffToNotify = await User.findOne({ role: 'staff', department: 'Finance' });
        break;
        
      case 'health':
        staffToNotify = await User.findOne({ role: 'staff', department: 'Health Services' });
        break;
        
      case 'departmentHead':
        staffToNotify = await User.findOne({ 
          role: 'staff', 
          department: student.department + ' HOD' 
        });
        break;
        
      default:
        staffToNotify = await User.findOne({ role: 'admin' });
    }
    
    // Send notification if appropriate staff was found
    if (staffToNotify) {
      const notification = new Notification({
        title: 'New Document Uploaded',
        description: `A student has uploaded a ${documentType} that requires your review`,
        recipient: staffToNotify._id,
        status: 'info',
        type: 'document_upload',
        documentId: document._id,
        documentName: title
      });
      await notification.save();
      
      console.log(`Notification sent to ${staffToNotify.fullName} (${staffToNotify.department}) for document: ${title}`);
    } else {
      console.warn(`No appropriate staff found to notify for document type: ${documentType}`);
      
      // Fallback: Notify any admin as a fallback
      const admin = await User.findOne({ role: 'admin' });
      if (admin) {
        const notification = new Notification({
          title: 'New Document Uploaded (No Approver Found)',
          description: `A student has uploaded a ${documentType} but no appropriate staff was found for review`,
          recipient: admin._id,
          status: 'warning',
          type: 'document_upload',
          documentId: document._id,
          documentName: title
        });
        await notification.save();
      }
    }
    
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
    
    // Log the file path for debugging
    console.log("Looking for file at path:", document.filePath);
    const absolutePath = path.join(__dirname, '..', document.filePath);
    console.log("Absolute file path:", absolutePath);
    
    if (!fs.existsSync(absolutePath)) {
      // Log more detailed error info
      console.error('File not found on server:', {
        documentId: document._id,
        filePath: document.filePath,
        absolutePath
      });
      
      return res.status(404).json({ 
        message: 'File not found on server',
        details: { documentPath: document.filePath }
      });
    }
    
    // Set response headers
    res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
    
    // Send file
    const fileStream = fs.createReadStream(absolutePath);
    fileStream.on('error', (err) => {
      console.error('Error streaming file:', err);
      res.status(500).json({ message: 'Error streaming file' });
    });
    
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
  try {
    // Get the document owner's department
    const student = await User.findById(document.owner);
    if (!student) {
      console.log(`Student not found for document: ${document._id}`);
      return false;
    }
    
    const studentDepartment = student.department;
    
    console.log("Staff approval check:", {
      staffId: staff._id,
      staffName: staff.fullName,
      staffDepartment: staff.department,
      staffManagedDepartments: staff.managedDepartments || [],
      studentDepartment,
      documentType: document.documentType
    });
    
    // Check for School Officer with managed departments
    if (staff.department === 'School Officer') {
      // For School Officers: Check if they can approve JAMB/WAEC documents
      if (['JAMB Result', 'JAMB Admission', 'WAEC'].includes(document.documentType)) {
        
        // Allow if they manage the student's department
        if (staff.managedDepartments && 
            staff.managedDepartments.includes(studentDepartment)) {
          console.log(`School Officer can approve ${document.documentType} for student in ${studentDepartment}`);
          return true;
        } else {
          console.log(`School Officer cannot approve - student department not managed by this officer`);
          return false;
        }
      }
    }
    
    // Other document types - standard checks
    switch (document.documentType) {
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
        // HOD can approve transcripts
        const hodDept = staff.department.replace(' HOD', '');
        return hodDept === studentDepartment;
      
      case 'Affidavit':
        // Add support for Affidavit documents
        return staff.department === 'Legal';
      
      case 'JAMB Result':
      case 'JAMB Admission':
      case 'WAEC':
        // These should be handled by the School Officer check above,
        // but we'll add this as a fallback
        if (staff.department === 'School Officer' && staff.managedDepartments) {
          return staff.managedDepartments.includes(studentDepartment);
        }
        return false;
        
      default:
        // Unknown document type
        return staff.role === 'admin';
    }
  } catch (error) {
    console.error('Error in canStaffApproveDocument:', error);
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
    console.log("getApprovableDocuments called by:", {
      staffId: req.user._id,
      staffName: req.user.fullName,
      department: req.user.department,
      managedDepartments: req.user.managedDepartments || []
    });
    
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
      let documentFilter = {};
      
      // Special handling for School Officer
      if (req.user.department === 'School Officer') {
        approverRoles.push('schoolOfficer');
        documentFilter = { 
          documentType: { $in: ['JAMB Result', 'JAMB Admission', 'WAEC'] } 
        };
        
        console.log("School Officer document filter set up", {
          approverRoles,
          documentFilter,
          managedDepartments: req.user.managedDepartments || []
        });
      } else {
        // For other departments
        switch (req.user.department) {
          case 'Registrar':
            approverRoles.push('deputyRegistrar');
            documentFilter = { documentType: 'Admission Letter' };
            break;
          case 'Student Support':
            approverRoles.push('studentSupport');
            documentFilter = { 
              documentType: { $in: ['Birth Certificate', 'Passport'] } 
            };
            break;
          case 'Finance':
            approverRoles.push('finance');
            documentFilter = { documentType: 'Payment Receipt' };
            break;
          case 'Health Services':
            approverRoles.push('health');
            documentFilter = { documentType: 'Medical Report' };
            break;
          case 'Legal':
            approverRoles.push('legal');
            documentFilter = { documentType: 'Affidavit' };
            break;
          default:
            // For academic departments with HOD
            if (req.user.department.includes('HOD')) {
              approverRoles.push('departmentHead');
              documentFilter = { documentType: 'Transcript' };
            }
        }
      }
      
      // Find documents that this staff can approve
      documents = await Document.find({
        status: 'pending',
        $or: [
          { approverRole: { $in: approverRoles } },
          documentFilter
        ]
      }).populate('owner', 'fullName email applicationId department');
      
      console.log(`Found ${documents.length} pending documents before department filtering`);
      
      // If this is a school officer, filter for students in their managed departments
      if (req.user.department === 'School Officer' && req.user.managedDepartments && req.user.managedDepartments.length > 0) {
        // Add detailed logging before filtering
        documents.forEach((doc, index) => {
          console.log(`Document ${index + 1}:`, {
            id: doc._id,
            documentType: doc.documentType,
            studentName: doc.owner?.fullName || 'Unknown',
            studentDepartment: doc.owner?.department || 'Unknown'
          });
        });
        
        // Filter documents based on student department
        documents = documents.filter(doc => 
          doc.owner && req.user.managedDepartments.includes(doc.owner.department)
        );
        
        console.log(`After filtering, ${documents.length} documents remain for School Officer to approve`);
      } else if (req.user.department.includes('HOD')) {
        // For HOD, filter for their specific department
        const deptName = req.user.department.replace(' HOD', '');
        documents = documents.filter(doc => 
          doc.owner && doc.owner.department === deptName
        );
      }
    }
    
    res.json(documents);
  } catch (error) {
    console.error('Error getting approvable documents:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};



// Define the approval roles needed for this form
const approvalRoles = [
  'schoolOfficer',
  'deputyRegistrar',
  'departmentHead',
  'studentSupport',
  'finance',
  'library',
  'health',
  'legal'  // Add the Legal department role
];

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
/**
 * Get documents approved by the current staff member
 * @route   GET /api/documents/approved-by-me
 * @access  Private (Staff only)
 */
const getApprovedDocumentsByStaff = async (req, res) => {
  try {
    const staffId = req.user._id;
    const department = req.user.department;
    
    // Determine which documents this staff can approve based on their department
    let documentFilter = {};
    
    switch (department) {
      case 'Registrar':
        documentFilter.documentType = 'Admission Letter';
        break;
      case 'Student Support':
        documentFilter.documentType = { $in: ['Birth Certificate', 'Passport'] };
        break;
      case 'Finance':
        documentFilter.documentType = 'Payment Receipt';
        break;
      case 'Health Services':
        documentFilter.documentType = 'Medical Report';
        break;
      default:
        // For academic departments
        if (department.includes('HOD')) {
          documentFilter.documentType = 'Transcript';
        } else {
          // School officers for standard documents
          documentFilter.documentType = { $in: ['JAMB Result', 'JAMB Admission', 'WAEC'] };
        }
    }
    
    const approvedDocuments = await Document.find({
      ...documentFilter,
      reviewedBy: staffId,
      status: 'approved'
    }).populate('owner', 'fullName email department');
    
    res.json(approvedDocuments);
  } catch (error) {
    console.error('Error fetching approved documents:', error);
    res.status(500).json({ 
      message: 'Server error fetching approved documents',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

/**
 * Get documents rejected by the current staff member
 * @route   GET /api/documents/rejected-by-me
 * @access  Private (Staff only)
 */
const getRejectedDocumentsByStaff = async (req, res) => {
  try {
    const staffId = req.user._id;
    const department = req.user.department;
    
    // Determine which documents this staff can approve based on their department
    let documentFilter = {};
    
    switch (department) {
      case 'Registrar':
        documentFilter.documentType = 'Admission Letter';
        break;
      case 'Student Support':
        documentFilter.documentType = { $in: ['Birth Certificate', 'Passport'] };
        break;
      case 'Finance':
        documentFilter.documentType = 'Payment Receipt';
        break;
      case 'Health Services':
        documentFilter.documentType = 'Medical Report';
        break;
      default:
        // For academic departments
        if (department.includes('HOD')) {
          documentFilter.documentType = 'Transcript';
        } else {
          // School officers for standard documents
          documentFilter.documentType = { $in: ['JAMB Result', 'JAMB Admission', 'WAEC'] };
        }
    }
    
    const rejectedDocuments = await Document.find({
      ...documentFilter,
      reviewedBy: staffId,
      status: 'rejected'
    }).populate('owner', 'fullName email department');
    
    res.json(rejectedDocuments);
  } catch (error) {
    console.error('Error fetching rejected documents:', error);
    res.status(500).json({ 
      message: 'Server error fetching rejected documents',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
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
  getApprovableDocuments,
  getCompletedClearances,
  getStudentClearanceStatus,
  checkClearanceCompletion,
  canStaffApproveDocument,
  deleteDocument, // Add this to the exports
  getApprovedDocumentsByStaff,
  getRejectedDocumentsByStaff
};