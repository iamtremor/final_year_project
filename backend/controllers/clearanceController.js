// backend/controllers/clearanceController.js
const NewClearanceForm = require('../models/NewClearanceForm');
const ProvAdmissionForm = require('../models/ProvAdmissionForm');
const PersonalRecordForm = require('../models/PersonalRecordForm');
const PersonalRecord2Form = require('../models/PersonalRecord2Form');
const AffidavitForm = require('../models/AffidavitForm');
const Document = require('../models/Document');
const User = require('../models/User');
const Notification = require('../models/Notification');
const blockchainService = require('../services/blockchainService');

/**
 * Get status of all forms for a student
 * @route   GET /api/clearance/forms
 * @access  Private (Student)
 */
const getFormsStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find all forms for this student
    const newClearanceForm = await NewClearanceForm.findOne({ studentId: userId });
    const provAdmissionForm = await ProvAdmissionForm.findOne({ studentId: userId });
    const personalRecordForm = await PersonalRecordForm.findOne({ studentId: userId });
    const personalRecord2Form = await PersonalRecord2Form.findOne({ studentId: userId });
    const affidavitForm = await AffidavitForm.findOne({ studentId: userId });
    
    // Check document status
    const documents = await Document.find({ owner: userId });
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
    
    // Create response with form status information
    const formStatus = {
      newClearance: {
        submitted: newClearanceForm ? true : false,
        deputyRegistrarApproved: newClearanceForm ? newClearanceForm.deputyRegistrarApproved : false,
        schoolOfficerApproved: newClearanceForm ? newClearanceForm.schoolOfficerApproved : false,
        approved: newClearanceApproved,
        data: newClearanceForm || null
      },
      provAdmission: {
        submitted: provAdmissionForm ? provAdmissionForm.submitted : false,
        approved: provAdmissionForm ? provAdmissionForm.approved : false,
        approvals: provAdmissionForm ? provAdmissionForm.approvals : [],
        data: provAdmissionForm || null,
        canSubmit: newClearanceApproved
      },
      personalRecord: {
        submitted: personalRecordForm ? personalRecordForm.submitted : false,
        approved: personalRecordForm ? personalRecordForm.approved : false,
        data: personalRecordForm || null,
        canSubmit: newClearanceApproved
      },
      personalRecord2: {
        submitted: personalRecord2Form ? personalRecord2Form.submitted : false,
        approved: personalRecord2Form ? personalRecord2Form.approved : false,
        data: personalRecord2Form || null,
        canSubmit: newClearanceApproved
      },
      affidavit: {
        submitted: affidavitForm ? affidavitForm.submitted : false,
        approved: affidavitForm ? affidavitForm.approved : false,
        data: affidavitForm || null,
        canSubmit: newClearanceApproved
      },
      documents: documentStatus,
      canUploadDocuments: newClearanceApproved,
      clearanceComplete: false // Will be updated below
    };
    
    // Check if all forms and required documents are approved
    const allFormsSubmitted = formStatus.newClearance.submitted &&
      formStatus.provAdmission.submitted &&
      formStatus.personalRecord.submitted &&
      formStatus.personalRecord2.submitted &&
      formStatus.affidavit.submitted;
    
    const allFormsApproved = formStatus.newClearance.approved &&
      formStatus.provAdmission.approved &&
      formStatus.personalRecord.approved &&
      formStatus.personalRecord2.approved &&
      formStatus.affidavit.approved;
    
    const allDocumentsApproved = requiredDocumentTypes.every(type => 
      documentStatus[type].approved
    );
    
    formStatus.clearanceComplete = allFormsSubmitted && allFormsApproved && allDocumentsApproved;
    
    res.json(formStatus);
  } catch (error) {
    console.error('Error fetching forms status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get a specific form by ID
 * @route   GET /api/clearance/forms/:formId
 * @access  Private
 */
const getFormById = async (req, res) => {
  try {
    const { formId } = req.params;
    const { formType } = req.query;

    console.log('Form Fetch Request:', {
      formId,
      formType,
      queryParams: req.query
    });

    // Validate formId
    if (!formId) {
      return res.status(400).json({ message: 'Form ID is required' });
    }

    // Normalize form type
    const normalizedFormType = formType === 'forms' 
      ? 'newClearance'  // Default to newClearance if 'forms' is passed
      : formType || 'newClearance';

    console.log('Normalized Form Type:', normalizedFormType);

    if (!normalizedFormType) {
      return res.status(400).json({ message: 'Form type is required' });
    }

    // Determine which model to use based on normalized form type
    let Model;
    switch (normalizedFormType) {
      case 'newClearance': 
        Model = require('../models/NewClearanceForm');
        break;
      case 'provAdmission': 
        Model = require('../models/ProvAdmissionForm');
        break;
      case 'personalRecord': 
        Model = require('../models/PersonalRecordForm');
        break;
      case 'personalRecord2': 
        Model = require('../models/PersonalRecord2Form');
        break;
      case 'affidavit': 
        Model = require('../models/AffidavitForm');
        break;
      default:
        return res.status(400).json({ message: 'Invalid form type' });
    }

    // Find the form
    const form = await Model.findById(formId).populate('studentId', 'fullName email department');
    
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    res.json(form);
  } catch (error) {
    console.error('Comprehensive form fetch error:', {
      message: error.message,
      stack: error.stack,
      fullError: error
    });
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

/**
 * Get all pending forms (for staff)
 * @route   GET /api/clearance/forms/pending
 * @access  Private (Staff only)
 */
const getPendingForms = async (req, res) => {
  try {
    // Validate user role
    if (req.user.role !== 'staff' && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Unauthorized: Staff or admin access only'
      });
    }

    console.log(`Fetching pending forms for staff: ${req.user.fullName}, ${req.user.department}`);
    
    let pendingForms = [];
    const staffDepartment = req.user.department;
    const managedDepartments = req.user.managedDepartments || [];
    
    // Process based on staff department
    if (staffDepartment === 'Registrar') {
      // For Deputy Registrar - Only show forms that they haven't approved yet
      const deputyRegistrarForms = await NewClearanceForm.find({
        deputyRegistrarApproved: false,
        submitted: true
      }).populate('studentId', 'fullName email department');

      console.log(`Found ${deputyRegistrarForms.length} new clearance forms pending Deputy Registrar approval`);
      
      pendingForms = pendingForms.concat(
        deputyRegistrarForms.map(form => ({
          ...form.toObject(),
          type: 'newClearance',
          id: form._id,
          formName: 'New Clearance Form'
        }))
      );
      
      // Also get Provisional Admission Forms that need Deputy Registrar approval
      const staffRole = 'deputyRegistrar';
      const pendingProvForms = await ProvAdmissionForm.find({
        submitted: true,
        approved: false,
        'approvals.staffRole': staffRole,
        'approvals.approved': false
      }).populate('studentId', 'fullName email department');
      
      console.log(`Found ${pendingProvForms.length} provisional admission forms pending Deputy Registrar approval`);
      
      pendingForms = pendingForms.concat(
        pendingProvForms.map(form => ({
          ...form.toObject(),
          type: 'provAdmission',
          id: form._id,
          formName: 'Provisional Admission Form'
        }))
      );
    } 
    // For School Officers
    else if (staffDepartment === 'School Officer' && managedDepartments.length > 0) {
      // Find students in these departments
      const studentsInManagedDepts = await User.find({ 
        role: 'student', 
        department: { $in: managedDepartments }
      });
      
      const studentIds = studentsInManagedDepts.map(s => s._id);
      
      console.log(`School Officer manages departments: ${managedDepartments.join(', ')}`);
      console.log(`Found ${studentIds.length} students in managed departments`);
      
      // Find forms for these students that are approved by Deputy Registrar but not by School Officer
      if (studentIds.length > 0) {
        const schoolOfficerForms = await NewClearanceForm.find({
          studentId: { $in: studentIds },
          deputyRegistrarApproved: true,
          schoolOfficerApproved: false,
          submitted: true
        }).populate('studentId', 'fullName email department');
  
        console.log(`Found ${schoolOfficerForms.length} new clearance forms pending School Officer approval`);
        
        pendingForms = pendingForms.concat(
          schoolOfficerForms.map(form => ({
            ...form.toObject(),
            type: 'newClearance',
            id: form._id,
            formName: 'New Clearance Form',
            studentName: form.studentId?.fullName || form.studentName,
            studentDepartment: form.studentId?.department
          }))
        );
        
        // Also get Provisional Admission Forms that need School Officer approval
        const staffRole = 'schoolOfficer';
        const pendingProvForms = await ProvAdmissionForm.find({
          studentId: { $in: studentIds },
          submitted: true,
          approved: false,
          'approvals.staffRole': staffRole,
          'approvals.approved': false
        }).populate('studentId', 'fullName email department');
        
        console.log(`Found ${pendingProvForms.length} provisional admission forms pending School Officer approval`);
        
        pendingForms = pendingForms.concat(
          pendingProvForms.map(form => ({
            ...form.toObject(),
            type: 'provAdmission',
            id: form._id,
            formName: 'Provisional Admission Form',
            studentName: form.studentId?.fullName || form.studentName,
            studentDepartment: form.studentId?.department
          }))
        );
      }
    }
    // For Department Heads (HOD)
    else if (staffDepartment.includes('HOD')) {
      const departmentName = staffDepartment.replace(' HOD', '');
      
      // Find students in this department
      const studentsInDept = await User.find({
        role: 'student',
        department: departmentName
      });
      
      const studentIds = studentsInDept.map(s => s._id);
      
      console.log(`HOD manages department: ${departmentName}`);
      console.log(`Found ${studentIds.length} students in department`);
      
      if (studentIds.length > 0) {
        // Get Provisional Admission Forms that need Department Head approval
        const staffRole = 'departmentHead';
        const pendingProvForms = await ProvAdmissionForm.find({
          studentId: { $in: studentIds },
          submitted: true,
          approved: false,
          'approvals.staffRole': staffRole,
          'approvals.approved': false
        }).populate('studentId', 'fullName email department');
        
        console.log(`Found ${pendingProvForms.length} provisional admission forms pending Department Head approval`);
        
        pendingForms = pendingForms.concat(
          pendingProvForms.map(form => ({
            ...form.toObject(),
            type: 'provAdmission',
            id: form._id,
            formName: 'Provisional Admission Form',
            studentName: form.studentId?.fullName || form.studentName,
            studentDepartment: form.studentId?.department
          }))
        );
      }
    }
    // For staff managing managed departments but not School Officer
    else if (managedDepartments.length > 0 && 
             !['Registrar', 'Student Support', 'Finance', 'Health Services', 'Library', 'Legal'].includes(staffDepartment)) {
      
      // Find students in managed departments
      const studentsInManagedDepts = await User.find({ 
        role: 'student', 
        department: { $in: managedDepartments }
      });
      
      const studentIds = studentsInManagedDepts.map(s => s._id);
      
      console.log(`Staff manages departments: ${managedDepartments.join(', ')}`);
      console.log(`Found ${studentIds.length} students in managed departments`);
      
      if (studentIds.length > 0) {
        const pendingForms = await NewClearanceForm.find({
          studentId: { $in: studentIds },
          deputyRegistrarApproved: true,
          schoolOfficerApproved: false,
          submitted: true
        }).populate('studentId', 'fullName email department');
        
        pendingForms = pendingForms.concat(
          pendingForms.map(form => ({
            ...form.toObject(),
            type: 'newClearance',
            id: form._id,
            formName: 'New Clearance Form',
            studentName: form.studentId?.fullName || form.studentName,
            studentDepartment: form.studentId?.department
          }))
        );
        
        // Get Provisional Admission Forms
        const pendingProvForms = await ProvAdmissionForm.find({
          studentId: { $in: studentIds },
          submitted: true,
          approved: false,
          'approvals.staffRole': 'schoolOfficer',
          'approvals.approved': false
        }).populate('studentId', 'fullName email department');
        
        pendingForms = pendingForms.concat(
          pendingProvForms.map(form => ({
            ...form.toObject(),
            type: 'provAdmission',
            id: form._id,
            formName: 'Provisional Admission Form',
            studentName: form.studentId?.fullName || form.studentName,
            studentDepartment: form.studentId?.department
          }))
        );
      }
    }
    // Handle other staff roles (studentSupport, finance, library, health, legal)
    else {
      // Map department to staff role
      let staffRole;
      switch(staffDepartment) {
        case 'Student Support': 
          staffRole = 'studentSupport'; 
          break;
        case 'Finance': 
          staffRole = 'finance'; 
          break;
        case 'Library': 
          staffRole = 'library'; 
          break;
        case 'Health Services': 
          staffRole = 'health'; 
          break;
        case 'Legal': 
          staffRole = 'legal'; 
          break;
        default:
          staffRole = null;
      }
      
      if (staffRole) {
        console.log(`Handling staff role: ${staffRole} for department ${staffDepartment}`);
        
        // For Student Support, also check for Personal Record Forms
        if (staffDepartment === 'Student Support') {
          const personalRecordForms = await PersonalRecordForm.find({
            submitted: true,
            approved: false
          }).populate('studentId', 'fullName email department');
          
          console.log(`Found ${personalRecordForms.length} personal record forms pending Student Support approval`);
          
          pendingForms = pendingForms.concat(
            personalRecordForms.map(form => ({
              ...form.toObject(),
              type: 'personalRecord',
              id: form._id,
              formName: 'Personal Record Form',
              studentName: form.studentId?.fullName || form.fullName,
              studentDepartment: form.studentId?.department || form.department
            }))
          );
        }
        
        // For Registrar, also check for Personal Record Part 2 Forms
        if (staffDepartment === 'Registrar') {
          const personalRecord2Forms = await PersonalRecord2Form.find({
            submitted: true,
            approved: false
          }).populate('studentId', 'fullName email department');
          
          console.log(`Found ${personalRecord2Forms.length} personal record part 2 forms pending Registrar approval`);
          
          pendingForms = pendingForms.concat(
            personalRecord2Forms.map(form => ({
              ...form.toObject(),
              type: 'personalRecord2',
              id: form._id,
              formName: 'Personal Record Form Part 2',
              studentName: form.studentId?.fullName || 'Unknown',
              studentDepartment: form.studentId?.department || 'Unknown'
            }))
          );
        }
        
        // For Legal, check for Affidavit Forms
        if (staffDepartment === 'Legal') {
          const affidavitForms = await AffidavitForm.find({
            submitted: true,
            approved: false
          }).populate('studentId', 'fullName email department');
          
          console.log(`Found ${affidavitForms.length} affidavit forms pending Legal approval`);
          
          pendingForms = pendingForms.concat(
            affidavitForms.map(form => ({
              ...form.toObject(),
              type: 'affidavit',
              id: form._id,
              formName: 'Affidavit Form',
              studentName: form.studentId?.fullName || form.studentName,
              studentDepartment: form.studentId?.department || form.department
            }))
          );
        }
        
        // Get Provisional Admission Forms for this role
        const pendingProvForms = await ProvAdmissionForm.find({
          submitted: true,
          approved: false,
          'approvals.staffRole': staffRole,
          'approvals.approved': false
        }).populate('studentId', 'fullName email department');
        
        console.log(`Found ${pendingProvForms.length} provisional admission forms for ${staffRole}`);
        
        pendingForms = pendingForms.concat(
          pendingProvForms.map(form => ({
            ...form.toObject(),
            type: 'provAdmission',
            id: form._id,
            formName: 'Provisional Admission Form',
            studentName: form.studentId?.fullName || form.studentName,
            studentDepartment: form.studentId?.department || form.department
          }))
        );
      }
    }
    
    // Add other form types here if needed
    
    // Finally, filter out any duplicates by ID
    const uniqueForms = pendingForms.filter((form, index, self) =>
      index === self.findIndex((f) => f.id.toString() === form.id.toString())
    );
    
    console.log(`Returning ${uniqueForms.length} unique pending forms`);
    
    res.json({
      totalPendingForms: uniqueForms.length,
      forms: uniqueForms
    });
  } catch (error) {
    console.error('Error in getPendingForms:', error);
    res.status(500).json({ 
      message: 'Server error fetching pending forms',
      details: error.message
    });
  }
};
/**
 * Get all forms for a specific student (for staff/admin)
 * @route   GET /api/clearance/forms/student/:studentId
 * @access  Private (Staff/Admin only)
 */
const getStudentForms = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Ensure only staff/admin can access this endpoint
    if (req.user.role !== 'staff' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized: Staff/Admin only' });
    }
    
    // Get all forms for this student
    const newClearanceForm = await NewClearanceForm.findOne({ studentId });
    const provAdmissionForm = await ProvAdmissionForm.findOne({ studentId });
    const personalRecordForm = await PersonalRecordForm.findOne({ studentId });
    const personalRecord2Form = await PersonalRecord2Form.findOne({ studentId });
    const affidavitForm = await AffidavitForm.findOne({ studentId });
    
    // Get student details
    const student = await User.findById(studentId, 'fullName email applicationId department');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Get document status
    const documents = await Document.find({ owner: studentId });
    
    res.json({
      student,
      forms: {
        newClearance: newClearanceForm,
        provAdmission: provAdmissionForm,
        personalRecord: personalRecordForm,
        personalRecord2: personalRecord2Form,
        affidavit: affidavitForm
      },
      documents
    });
  } catch (error) {
    console.error('Error getting student forms:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Helper function to check if a student's clearance process is complete
 * @param {string} studentId - Student's ID
 */
const checkClearanceCompletion = async (studentId) => {
  // Find all required forms
  const newClearanceForm = await NewClearanceForm.findOne({ studentId });
  const provAdmissionForm = await ProvAdmissionForm.findOne({ studentId });
  const personalRecordForm = await PersonalRecordForm.findOne({ studentId });
  const personalRecord2Form = await PersonalRecord2Form.findOne({ studentId });
  const affidavitForm = await AffidavitForm.findOne({ studentId });
  
  // Check if all forms exist and are approved
  const newClearanceApproved = newClearanceForm && 
    newClearanceForm.deputyRegistrarApproved && 
    newClearanceForm.schoolOfficerApproved;
    
  const provAdmissionApproved = provAdmissionForm && provAdmissionForm.approved;
  const personalRecordApproved = personalRecordForm && personalRecordForm.approved;
  const personalRecord2Approved = personalRecord2Form && personalRecord2Form.approved;
  const affidavitApproved = affidavitForm && affidavitForm.approved;
  
  // Check required documents
  const requiredDocumentTypes = [
    'Admission Letter', 'JAMB Result', 'JAMB Admission', 
    'WAEC', 'Birth Certificate', 'Payment Receipt', 
    'Medical Report', 'Passport'
  ];
  
  // Get all approved documents for this student
  const approvedDocs = await Document.find({
    owner: studentId,
    status: 'approved'
  });
  
  // Check if all required document types are approved
  const allDocumentsApproved = requiredDocumentTypes.every(type => 
    approvedDocs.some(doc => doc.documentType === type)
  );
  
  // Check if clearance is complete
  const clearanceComplete = newClearanceApproved && 
    provAdmissionApproved && 
    personalRecordApproved && 
    personalRecord2Approved && 
    affidavitApproved && 
    allDocumentsApproved;
  
  if (clearanceComplete) {
    // Find the student
    const student = await User.findById(studentId);
    
    if (student && student.applicationId) {
      // Record completion on blockchain
      try {
        const blockchainResult = await blockchainService.completeClearanceProcess(
          student.applicationId
        );
        
        console.log(`Clearance process completed on blockchain: ${blockchainResult.transactionHash}`);
        
        // Create notification for student
        const notification = new Notification({
          title: 'Clearance Process Completed',
          description: 'Congratulations! Your clearance process is now complete.',
          recipient: studentId,
          status: 'success',
          type: 'clearance_complete'
        });
        await notification.save();
        
        return true;
      } catch (error) {
        console.error('Error recording clearance completion:', error);
      }
    }
  }
  
  return false;
};

/**
 * Helper function to convert department to staff role
 */
const getStaffRoleFromDepartment = (department) => {
  switch (department) {
    case 'Registrar':
      return 'deputyRegistrar';
    case 'Student Support':
      return 'studentSupport';
    case 'Finance':
      return 'finance';
    case 'Library':
      return 'library';
    case 'Health Services':
      return 'health';
    case 'Legal':
      return 'legal';
    case 'School Officer':
      return 'schoolOfficer';
    default:
      // For academic departments, assume school officer or department head
      return department.includes('HOD') ? 'departmentHead' : 'schoolOfficer';
  }
};

/**
 * Submit new clearance form
 * @route   POST /api/clearance/forms/new-clearance
 * @access  Private (Student)
 */
const submitNewClearanceForm = async (req, res) => {
  try {
    const userId = req.user._id;
    const applicationId = req.user.applicationId;
    
    // Check if form already exists
    let form = await NewClearanceForm.findOne({ studentId: userId });
    
    if (form) {
      return res.status(400).json({ message: 'Form has already been submitted' });
    }
    
    // Create new form
    form = new NewClearanceForm({
      studentId: userId,
      studentName: req.body.studentName,
      jambRegNo: req.body.jambRegNo,
      oLevelQualification: req.body.oLevelQualification || false,
      changeOfCourse: req.body.changeOfCourse || false,
      changeOfInstitution: req.body.changeOfInstitution || false,
      uploadOLevel: req.body.uploadOLevel || false,
      jambAdmissionLetter: req.body.jambAdmissionLetter || false,
      submittedDate: new Date()
    });
    
    await form.save();
    
    // Create a notification for staff
    const notification = new Notification({
      title: 'New Clearance Form Submitted',
      description: `Student ${req.body.studentName} has submitted a new clearance form for approval.`,
      recipient: null, // Will be set to appropriate staff
      status: 'info',
      type: 'form_submission'
    });
    
    // Find a deputy registrar to notify
    const deputyRegistrar = await User.findOne({ role: 'staff', department: 'Registrar' });
    if (deputyRegistrar) {
      notification.recipient = deputyRegistrar._id;
      await notification.save();
    }
    
    // Record on blockchain if available
    try {
      if (applicationId) {
        const blockchainResult = await blockchainService.recordClearanceForm(
          applicationId,
          'newClearance',
          req.body
        );
        
        // Update form with blockchain transaction info
        form.blockchainTxHash = blockchainResult.transactionHash;
        form.blockchainBlockNumber = blockchainResult.blockNumber;
        await form.save();
        
        console.log(`New clearance form recorded on blockchain: ${blockchainResult.transactionHash}`);
      }
    } catch (blockchainError) {
      console.error('Blockchain recording error:', blockchainError);
      // Continue with response, don't fail if blockchain has issues
    }
    
    res.status(201).json({
      message: 'Form submitted successfully',
      formId: form._id
    });
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Submit provisional admission form
 * @route   POST /api/clearance/forms/prov-admission
 * @access  Private (Student)
 */
const submitProvAdmissionForm = async (req, res) => {
  try {
    const userId = req.user._id;
    const applicationId = req.user.applicationId;
    
    // First check if new clearance form is approved
    const newClearanceForm = await NewClearanceForm.findOne({ studentId: userId });
    
    if (!newClearanceForm || !newClearanceForm.deputyRegistrarApproved || !newClearanceForm.schoolOfficerApproved) {
      return res.status(400).json({ 
        message: 'New Clearance Form must be approved before submitting this form' 
      });
    }
    
    // Check if form already exists
    let form = await ProvAdmissionForm.findOne({ studentId: userId });
    
    if (form && form.submitted) {
      return res.status(400).json({ message: 'Form has already been submitted' });
    }
    
    // Define the approval roles needed for this form
    const approvalRoles = [
      'schoolOfficer',
      'deputyRegistrar',
      'departmentHead',
      'studentSupport',
      'finance',
      'library',
      'health'
    ];
    
    if (form) {
      // Update existing form
      form.studentName = req.body.studentName;
      form.department = req.body.department;
      form.course = req.body.course;
      form.submitted = true;
      form.submittedDate = new Date();
    } else {
      // Create approval structure
      const approvals = approvalRoles.map(role => ({
        staffRole: role,
        approved: false
      }));
      
      // Create new form
      form = new ProvAdmissionForm({
        studentId: userId,
        studentName: req.body.studentName,
        department: req.body.department,
        course: req.body.course,
        approvals,
        submitted: true,
        submittedDate: new Date()
      });
    }
    
    await form.save();
    
    // Notify school officer about the form submission
    const schoolOfficer = await User.findOne({ role: 'staff', department: req.body.department });
    if (schoolOfficer) {
      const notification = new Notification({
        title: 'Provisional Admission Form Submitted',
        description: `Student ${req.body.studentName} has submitted a provisional admission form.`,
        recipient: schoolOfficer._id,
        status: 'info',
        type: 'form_submission'
      });
      await notification.save();
    }
    
    // Record on blockchain if available
    try {
      if (applicationId) {
        const blockchainResult = await blockchainService.recordClearanceForm(
          applicationId,
          'provAdmission',
          req.body
        );
        
        console.log(`Provisional admission form recorded on blockchain: ${blockchainResult.transactionHash}`);
      }
    } catch (blockchainError) {
      console.error('Blockchain recording error:', blockchainError);
      // Continue with response, don't fail if blockchain has issues
    }
    
    res.status(201).json({
      message: 'Form submitted successfully',
      formId: form._id
    });
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Submit personal record form
 * @route   POST /api/clearance/forms/personal-record
 * @access  Private (Student)
 */
const submitPersonalRecordForm = async (req, res) => {
  try {
    const userId = req.user._id;
    const applicationId = req.user.applicationId;
    
    // First check if new clearance form is approved
    const newClearanceForm = await NewClearanceForm.findOne({ studentId: userId });
    
    if (!newClearanceForm || !newClearanceForm.deputyRegistrarApproved || !newClearanceForm.schoolOfficerApproved) {
      return res.status(400).json({ 
        message: 'New Clearance Form must be approved before submitting this form' 
      });
    }
    
    // Check if form already exists
    let form = await PersonalRecordForm.findOne({ studentId: userId });
    
    if (form && form.submitted) {
      return res.status(400).json({ message: 'Form has already been submitted' });
    }
    
    if (form) {
      // Update existing form with all fields from request body
      for (const [key, value] of Object.entries(req.body)) {
        if (key !== 'studentId' && key !== '_id') { // Skip these fields
          form[key] = value;
        }
      }
      form.submitted = true;
      form.submittedDate = new Date();
    } else {
      // Create new form with request body and add studentId
      form = new PersonalRecordForm({
        ...req.body,
        studentId: userId,
        submitted: true,
        submittedDate: new Date()
      });
    }
    
    await form.save();
    
    // Notify student support about the form submission
    const studentSupport = await User.findOne({ role: 'staff', department: 'Student Support' });
    if (studentSupport) {
      const notification = new Notification({
        title: 'Personal Record Form Submitted',
        description: `Student ${req.body.fullName} has submitted a personal record form.`,
        recipient: studentSupport._id,
        status: 'info',
        type: 'form_submission'
      });
      await notification.save();
    }
    
    // Record on blockchain if available
    try {
      if (applicationId) {
        const blockchainResult = await blockchainService.recordClearanceForm(
          applicationId,
          'personalRecord',
          req.body
        );
        
        console.log(`Personal record form recorded on blockchain: ${blockchainResult.transactionHash}`);
      }
    } catch (blockchainError) {
      console.error('Blockchain recording error:', blockchainError);
      // Continue with response, don't fail if blockchain has issues
    }
    
    res.status(201).json({
      message: 'Form submitted successfully',
      formId: form._id
    });
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Submit personal record 2 form (with family info)
 * @route   POST /api/clearance/forms/personal-record2
 * @access  Private (Student)
 */
const submitPersonalRecord2Form = async (req, res) => {
  try {
    const userId = req.user._id;
    const applicationId = req.user.applicationId;
    
    // First check if new clearance form is approved
    const newClearanceForm = await NewClearanceForm.findOne({ studentId: userId });
    
    if (!newClearanceForm || !newClearanceForm.deputyRegistrarApproved || !newClearanceForm.schoolOfficerApproved) {
      return res.status(400).json({ 
        message: 'New Clearance Form must be approved before submitting this form' 
      });
    }
    
    // Check if form already exists
    let form = await PersonalRecord2Form.findOne({ studentId: userId });
    
    if (form && form.submitted) {
      return res.status(400).json({ message: 'Form has already been submitted' });
    }
    
    if (form) {
      // Update existing form with all fields from request body
      for (const [key, value] of Object.entries(req.body)) {
        if (key !== 'studentId' && key !== '_id') { // Skip these fields
          form[key] = value;
        }
      }
      form.submitted = true;
      form.submittedDate = new Date();
    } else {
      // Create new form with request body and add studentId
      form = new PersonalRecord2Form({
        ...req.body,
        studentId: userId,
        submitted: true,
        submittedDate: new Date()
      });
    }
    
    await form.save();
    
    // Notify registrar about the form submission
    const registrar = await User.findOne({ role: 'staff', department: 'Registrar' });
    if (registrar) {
      const notification = new Notification({
        title: 'Personal Record Form 2 Submitted',
        description: `Student ${req.body.parentGuardianName}'s family has submitted personal record form part 2.`,
        recipient: registrar._id,
        status: 'info',
        type: 'form_submission'
      });
      await notification.save();
    }
    
    // Record on blockchain if available
    try {
      if (applicationId) {
        const blockchainResult = await blockchainService.recordClearanceForm(
          applicationId,
          'personalRecord2',
          req.body
        );
        
        console.log(`Personal record 2 form recorded on blockchain: ${blockchainResult.transactionHash}`);
      }
    } catch (blockchainError) {
      console.error('Blockchain recording error:', blockchainError);
      // Continue with response, don't fail if blockchain has issues
    }
    
    res.status(201).json({
      message: 'Form submitted successfully',
      formId: form._id
    });
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Submit affidavit form
 * @route   POST /api/clearance/forms/affidavit
 * @access  Private (Student)
 */
const submitAffidavitForm = async (req, res) => {
  try {
    const userId = req.user._id;
    const applicationId = req.user.applicationId;
    
    // First check if new clearance form is approved
    const newClearanceForm = await NewClearanceForm.findOne({ studentId: userId });
    
    if (!newClearanceForm || !newClearanceForm.deputyRegistrarApproved || !newClearanceForm.schoolOfficerApproved) {
      return res.status(400).json({ 
        message: 'New Clearance Form must be approved before submitting this form' 
      });
    }
    
    // Check if form already exists
    let form = await AffidavitForm.findOne({ studentId: userId });
    
    if (form && form.submitted) {
      return res.status(400).json({ message: 'Form has already been submitted' });
    }
    
    if (form) {
      // Update existing form
      form.studentName = req.body.studentName;
      form.faculty = req.body.faculty;
      form.department = req.body.department;
      form.course = req.body.course;
      form.agreementDate = req.body.agreementDate || new Date();
      form.signature = req.body.signature;
      form.submitted = true;
      form.submittedDate = new Date();
    } else {
      // Create new form
      form = new AffidavitForm({
        studentId: userId,
        studentName: req.body.studentName,
        faculty: req.body.faculty,
        department: req.body.department,
        course: req.body.course,
        agreementDate: req.body.agreementDate || new Date(),
        signature: req.body.signature,
        submitted: true,
        submittedDate: new Date()
      });
    }
    
    await form.save();
    
    // Notify legal department about the form submission
    const legalOfficer = await User.findOne({ role: 'staff', department: 'Legal' });
    if (legalOfficer) {
      const notification = new Notification({
        title: 'Affidavit Form Submitted',
        description: `Student ${req.body.studentName} has submitted an affidavit form.`,
        recipient: legalOfficer._id,
        status: 'info',
        type: 'form_submission'
      });
      await notification.save();
    }
    
    // Record on blockchain if available
    try {
      if (applicationId) {
        const blockchainResult = await blockchainService.recordClearanceForm(
          applicationId,
          'affidavit',
          req.body
        );
        
        console.log(`Affidavit form recorded on blockchain: ${blockchainResult.transactionHash}`);
      }
    } catch (blockchainError) {
      console.error('Blockchain recording error:', blockchainError);
      // Continue with response, don't fail if blockchain has issues
    }
    
    res.status(201).json({
      message: 'Form submitted successfully',
      formId: form._id
    });
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Staff form approval controller
 * @route   POST /api/clearance/forms/:formId/approve
 * @access  Private (Staff)
 */
const approveForm = async (req, res) => {
  try {
    const { formId } = req.params;
    const { formType, approvalType, comments } = req.body;
    const staffId = req.user._id;
    const staffRole = req.user.role;
    
    console.log(`Form approval request: ${formType} - ${approvalType} by ${req.user.department}`);
    
    if (staffRole !== 'staff' && staffRole !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized: Only staff can approve forms' });
    }
    
    // Determine which model to use based on formType
    let Model;
    if (formType === 'newClearance') Model = NewClearanceForm;
    else if (formType === 'provAdmission') Model = ProvAdmissionForm;
    else if (formType === 'personalRecord') Model = PersonalRecordForm;
    else if (formType === 'personalRecord2') Model = PersonalRecord2Form;
    else if (formType === 'affidavit') Model = AffidavitForm;
    
    if (!Model) {
      return res.status(400).json({ message: 'Invalid form type' });
    }
    
    // Find the form
    let form = await Model.findById(formId);
    
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }
    
    // Get the student
    const student = await User.findById(form.studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    console.log(`Processing ${formType} form for student: ${student.fullName}`);
    
    // Handle approval based on form type
    if (formType === 'newClearance') {
      // For New Clearance Form, we have specific approvals for Deputy Registrar and School Officer
      if (approvalType === 'deputyRegistrar') {
        form.deputyRegistrarApproved = true;
        form.deputyRegistrarApprovedDate = new Date();
        form.deputyRegistrarApprovedBy = staffId;
        
        if (comments) {
          form.deputyRegistrarComments = comments;
        }
        
        console.log(`Deputy Registrar approval set to true`);
      } else if (approvalType === 'schoolOfficer') {
        form.schoolOfficerApproved = true;
        form.schoolOfficerApprovedDate = new Date();
        form.schoolOfficerApprovedBy = staffId;
        
        if (comments) {
          form.schoolOfficerComments = comments;
        }
        
        console.log(`School Officer approval set to true`);
      } else {
        return res.status(400).json({ message: 'Invalid approval type for New Clearance Form' });
      }
      
      // Set overall approval status if both approvals are complete
      if (form.deputyRegistrarApproved && form.schoolOfficerApproved) {
        form.approved = true;
        form.approvedDate = new Date();
        console.log(`Setting overall form approval to true`);
        
        // Create notification for student that they can proceed with other forms
        const notification = new Notification({
          title: 'New Clearance Form Approved',
          description: 'Your New Clearance Form has been fully approved. You can now submit other forms and upload documents.',
          recipient: student._id,
          status: 'success',
          type: 'form_approval'
        });
        await notification.save();
      } else {
        // Partial approval notification
        const approvalBy = approvalType === 'deputyRegistrar' ? 'Deputy Registrar' : 'School Officer';
        const notification = new Notification({
          title: 'Partial Form Approval',
          description: `Your New Clearance Form has been approved by ${approvalBy}.`,
          recipient: student._id,
          status: 'info',
          type: 'form_approval'
        });
        await notification.save();
        
        // If Deputy Registrar approves, notify relevant School Officer
        if (approvalType === 'deputyRegistrar') {
          // Find School Officer who manages this student's department
          const schoolOfficers = await User.find({
            role: 'staff',
            managedDepartments: { $in: [student.department] }
          });
          
          if (schoolOfficers.length > 0) {
            // Create notification for the School Officer
            const officerNotification = new Notification({
              title: 'New Clearance Form Needs Review',
              description: `A New Clearance Form for ${student.fullName} has been approved by Deputy Registrar and now needs your review.`,
              recipient: schoolOfficers[0]._id, // Notify the first found school officer
              status: 'info',
              type: 'form_submission'
            });
            await officerNotification.save();
          }
        }
      }
    } else if (formType === 'provAdmission') {
      // For Provisional Admission, we need specific staff approvals
      const approvalIndex = form.approvals.findIndex(a => a.staffRole === approvalType);
      
      if (approvalIndex === -1) {
        return res.status(400).json({ message: `Invalid approval type "${approvalType}" for this form` });
      }
      
      // Update the approval
      form.approvals[approvalIndex].approved = true;
      form.approvals[approvalIndex].staffId = staffId;
      form.approvals[approvalIndex].approvedDate = new Date();
      if (comments) {
        form.approvals[approvalIndex].comments = comments;
      }
      
      console.log(`Updated approval for role ${approvalType}`);
      
      // Check if all approvals are complete
      const allApproved = form.approvals.every(approval => approval.approved);
      if (allApproved) {
        form.approved = true;
        form.approvedDate = new Date();
        
        console.log(`All approvals complete, setting form approval to true`);
        
        // Notify student of full approval
        const notification = new Notification({
          title: 'Provisional Admission Form Fully Approved',
          description: 'Your Provisional Admission Form has been approved by all required staff.',
          recipient: student._id,
          status: 'success',
          type: 'form_approval'
        });
        await notification.save();
      } else {
        // Notify student of partial approval
        const notification = new Notification({
          title: 'Partial Form Approval',
          description: `Your Provisional Admission Form has been approved by ${approvalType}.`,
          recipient: student._id,
          status: 'info',
          type: 'form_approval'
        });
        await notification.save();
        
        // Find next staff member who needs to approve and notify them
        const pendingApprovals = form.approvals.filter(a => !a.approved);
if (pendingApprovals.length > 0) {
  const nextRole = pendingApprovals[0].staffRole;
  
  // Map role to department
  let nextDepartment;
  switch (nextRole) {
    case 'deputyRegistrar': nextDepartment = 'Registrar'; break;
    case 'studentSupport': nextDepartment = 'Student Support'; break;
    case 'finance': nextDepartment = 'Finance'; break;
    case 'health': nextDepartment = 'Health Services'; break;
    case 'library': nextDepartment = 'Library'; break;
    case 'legal': nextDepartment = 'Legal'; break;
    case 'departmentHead': nextDepartment = `${student.department} HOD`; break;
    case 'schoolOfficer': 
      // Find school officers who manage this student's department
      const schoolOfficers = await User.find({
        role: 'staff',
        department: 'School Officer',
        managedDepartments: { $in: [student.department] }
      });
      
      if (schoolOfficers.length > 0) {
        // Create notification for the first school officer found
        const nextStaffNotification = new Notification({
          title: 'Provisional Admission Form Needs Review',
          description: `A Provisional Admission Form for ${student.fullName} needs your review.`,
          recipient: schoolOfficers[0]._id,
          status: 'info',
          type: 'form_submission'
        });
        await nextStaffNotification.save();
      }
      break;
  }
  
  if (nextDepartment) {
    // Find staff member in that department
    const nextStaff = await User.findOne({
      role: 'staff',
      department: nextDepartment
    });
    
    if (nextStaff) {
      // Create notification for next staff member
      const nextStaffNotification = new Notification({
        title: 'Provisional Admission Form Needs Review',
        description: `A Provisional Admission Form for ${student.fullName} needs your review.`,
        recipient: nextStaff._id,
        status: 'info',
        type: 'form_submission'
      });
      await nextStaffNotification.save();
    }
  }

          
          if (nextDepartment) {
            // Find staff member in that department
            const nextStaff = await User.findOne({
              role: 'staff',
              department: nextDepartment
            });
            
            if (nextStaff) {
              // Create notification for next staff member
              const nextStaffNotification = new Notification({
                title: 'Provisional Admission Form Needs Review',
                description: `A Provisional Admission Form for ${student.fullName} needs your review.`,
                recipient: nextStaff._id,
                status: 'info',
                type: 'form_submission'
              });
              await nextStaffNotification.save();
            }
          }
        }
      }
    } else {
      // For other forms, just a simple approval
      form.approved = true;
      form.approvedDate = new Date();
      form.approvedBy = staffId;
      
      // Add comments if provided
      if (comments) {
        form.approvalComments = comments;
      }
      
      // Notify student
      const notification = new Notification({
        title: `${formType.charAt(0).toUpperCase() + formType.slice(1)} Form Approved`,
        description: `Your ${formType} form has been approved.`,
        recipient: student._id,
        status: 'success',
        type: 'form_approval'
      });
      await notification.save();
    }
    
    // Save the form changes
    await form.save();
    
    // Verify the changes were saved by re-fetching
    const updatedForm = await Model.findById(formId);
    console.log(`Form after save - ${formType}:`, {
      id: updatedForm._id,
      deputyRegistrarApproved: updatedForm.deputyRegistrarApproved,
      schoolOfficerApproved: updatedForm.schoolOfficerApproved,
      approved: updatedForm.approved
    });
    
    // Record on blockchain if available
    try {
      if (student.applicationId) {
        const blockchainResult = await blockchainService.recordFormApproval(
          student.applicationId,
          formType,
          approvalType
        );
        
        console.log(`Form approval recorded on blockchain: ${blockchainResult.transactionHash}`);
      }
    } catch (blockchainError) {
      console.error('Blockchain recording error:', blockchainError);
      // Continue with response, don't fail if blockchain has issues
    }
    
    // Check if all forms are approved for this student
    try {
      await checkClearanceCompletion(student._id);
    } catch (err) {
      console.error('Error checking clearance completion:', err);
    }
    
    res.json({
      message: 'Form approved successfully',
      formId: form._id,
      formType,
      approvalType,
      status: {
        deputyRegistrarApproved: updatedForm.deputyRegistrarApproved,
        schoolOfficerApproved: updatedForm.schoolOfficerApproved,
        approved: updatedForm.approved
      }
    });
  } catch (error) {
    console.error('Error approving form:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
};

/**
 * Get forms rejected by the current staff member
 * @route   GET /api/clearance/forms/rejected-by-me
 * @access  Private (Staff only)
 */
/**
 * Get forms approved by the current staff member
 * @route   GET /api/clearance/forms/approved-by-me
 * @access  Private (Staff only)
 */
const getApprovedFormsByStaff = async (req, res) => {
  try {
    console.log('Staff Approved Forms Request Details:', {
      user: {
        id: req.user._id,
        role: req.user.role,
        department: req.user.department,
        managedDepartments: req.user.managedDepartments || []
      }
    });

    const staffId = req.user._id;
    const department = req.user.department;
    const managedDepartments = req.user.managedDepartments || [];

    // Array to store approved forms
    const approvedForms = [];

    // For New Clearance Forms
    if (department === 'Registrar') {
      // Deputy Registrar approved forms
      const deputyRegistrarForms = await NewClearanceForm.find({
        deputyRegistrarApproved: true,
        // For exact staff tracking
        deputyRegistrarApprovedBy: staffId
      }).populate('studentId', 'fullName email department');

      approvedForms.push(...deputyRegistrarForms.map(form => ({
        ...form.toObject(),
        type: 'newClearance',
        formName: 'New Clearance Form',
        studentName: form.studentId?.fullName || form.studentName,
        studentDepartment: form.studentId?.department || 'Unknown'
      })));
    } 
    // School Officer approved New Clearance Forms
    else if (managedDepartments.length > 0) {
      // Find students in managed departments
      const studentsInManagedDepts = await User.find({
        role: 'student',
        department: { $in: managedDepartments }
      });
      
      if (studentsInManagedDepts.length > 0) {
        const studentIds = studentsInManagedDepts.map(s => s._id);
        
        // Find forms approved by this school officer
        const schoolOfficerForms = await NewClearanceForm.find({
          studentId: { $in: studentIds },
          schoolOfficerApproved: true,
          // For exact staff tracking
          schoolOfficerApprovedBy: staffId
        }).populate('studentId', 'fullName email department');
        
        approvedForms.push(...schoolOfficerForms.map(form => ({
          ...form.toObject(),
          type: 'newClearance',
          formName: 'New Clearance Form',
          studentName: form.studentId?.fullName || form.studentName,
          studentDepartment: form.studentId?.department || 'Unknown'
        })));
      }
    }

    // For Provisional Admission Forms - handle all staff roles
    let staffRole = '';
    switch (department) {
      case 'Registrar': staffRole = 'deputyRegistrar'; break;
      case 'Student Support': staffRole = 'studentSupport'; break;
      case 'Finance': staffRole = 'finance'; break;
      case 'Library': staffRole = 'library'; break;
      case 'Health Services': staffRole = 'health'; break;
      default:
        if (department.includes('HOD')) {
          staffRole = 'departmentHead';
        } else if (managedDepartments.length > 0) {
          staffRole = 'schoolOfficer';
        }
    }
    
    if (staffRole) {
      // Find provisional admission forms approved by this staff member
      const provForms = await ProvAdmissionForm.find({
        'approvals.staffRole': staffRole,
        'approvals.staffId': staffId,
        'approvals.approved': true
      }).populate('studentId', 'fullName email department');
      
      approvedForms.push(...provForms.map(form => ({
        ...form.toObject(),
        type: 'provAdmission',
        formName: 'Provisional Admission Form',
        studentName: form.studentId?.fullName || form.studentName,
        studentDepartment: form.studentId?.department || form.department || 'Unknown'
      })));
    }

    // For other form types - based on staff department
    // Personal Record Forms
    if (department === 'Student Support') {
      const personalRecordForms = await PersonalRecordForm.find({
        approved: true,
        approvedBy: staffId
      }).populate('studentId', 'fullName email department');
      
      approvedForms.push(...personalRecordForms.map(form => ({
        ...form.toObject(),
        type: 'personalRecord',
        formName: 'Personal Record Form',
        studentName: form.studentId?.fullName || form.fullName,
        studentDepartment: form.studentId?.department || form.department || 'Unknown'
      })));
    }
    
    // Personal Record Form Part 2
    if (department === 'Registrar') {
      const personalRecord2Forms = await PersonalRecord2Form.find({
        approved: true,
        approvedBy: staffId
      }).populate('studentId', 'fullName email department');
      
      approvedForms.push(...personalRecord2Forms.map(form => ({
        ...form.toObject(),
        type: 'personalRecord2',
        formName: 'Personal Record Form Part 2',
        studentName: form.studentId?.fullName || 'Unknown',
        studentDepartment: form.studentId?.department || 'Unknown'
      })));
    }
    
    // Affidavit Forms - for Legal department
    if (department === 'Legal') {
      const affidavitForms = await AffidavitForm.find({
        approved: true,
        approvedBy: staffId
      }).populate('studentId', 'fullName email department');
      
      approvedForms.push(...affidavitForms.map(form => ({
        ...form.toObject(),
        type: 'affidavit',
        formName: 'Affidavit Form',
        studentName: form.studentId?.fullName || form.studentName,
        studentDepartment: form.studentId?.department || form.department || 'Unknown'
      })));
    }

    console.log(`Found ${approvedForms.length} forms approved by staff member`);

    // Return the forms
    res.json(approvedForms);
  } catch (error) {
    console.error('Error in getApprovedFormsByStaff:', error);
    res.status(500).json({ 
      message: 'Server error fetching approved forms',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};


/**
 * Get forms rejected by the current staff member
 * @route   GET /api/clearance/forms/rejected-by-me
 * @access  Private (Staff only)
 */
const getRejectedFormsByStaff = async (req, res) => {
  try {
    // For the MVP, we're not implementing form rejection yet
    // This would follow a similar pattern to the approved forms function
    // but look for rejection indicators instead
    
    // For now, return an empty array
    res.json([]);
  } catch (error) {
    console.error('Error in getRejectedFormsByStaff:', error);
    res.status(500).json({ 
      message: 'Server error fetching rejected forms',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Add these to your exports

module.exports = {
  getFormsStatus,
  submitNewClearanceForm,
  submitProvAdmissionForm,
  submitPersonalRecordForm,
  submitPersonalRecord2Form,
  submitAffidavitForm,
  approveForm,
  getFormById,
  getPendingForms,
  getStudentForms,
  getApprovedFormsByStaff,
  getRejectedFormsByStaff
};