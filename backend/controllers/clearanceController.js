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
    console.log(req.query)
    const { formId } = req.params;
    const { formType } = req.query;
    
    if (!formType) {
      return res.status(400).json({ message: 'Form type is required' });
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
    const form = await Model.findById(formId);
    
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }
    
    // Check if user has permission to view this form
    if (
      form.studentId.toString() !== req.user._id.toString() && 
      req.user.role !== 'staff' && 
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    res.json(form);
  } catch (error) {
    console.error('Error getting form:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get all pending forms (for staff)
 * @route   GET /api/clearance/forms/pending
 * @access  Private (Staff only)
 */
const getPendingForms = async (req, res) => {
  try {
    // Comprehensive logging
    console.log('Pending Forms Request Details:', {
      user: {
        id: req.user._id,
        role: req.user.role,
        department: req.user.department
      },
      query: req.query
    });

    // Validate user role
    if (req.user.role !== 'staff' && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Unauthorized: Staff or admin access only',
        details: {
          userRole: req.user.role
        }
      });
    }

    // Fetch pending forms from different models
    const NewClearanceForm = require('../models/NewClearanceForm');
    const ProvAdmissionForm = require('../models/ProvAdmissionForm');
    const PersonalRecordForm = require('../models/PersonalRecordForm');
    const PersonalRecord2Form = require('../models/PersonalRecord2Form');
    const AffidavitForm = require('../models/AffidavitForm');
    const User = require('../models/User');

    let pendingForms = [];

    // For Registrar - New Clearance Forms not yet approved
    if (req.user.department === 'Registrar') {
      // First, log total count of all forms to check if any exist
      const totalNewClearanceForms = await NewClearanceForm.countDocuments({});
      console.log(`Total NewClearanceForm documents in database: ${totalNewClearanceForms}`);
      
      // Check all forms with pending status
      const allPendingForms = await NewClearanceForm.find({
        deputyRegistrarApproved: false,
        submitted: true
      });
      
      console.log(`Found ${allPendingForms.length} pending forms for Registrar`);
      
      // Check if the forms have valid student references
      for (const form of allPendingForms) {
        const student = await User.findById(form.studentId);
        console.log(`Form ${form._id} belongs to student:`, student ? student.fullName : 'Not found');
      }

      const registrarForms = await NewClearanceForm.find({
        deputyRegistrarApproved: false,
        submitted: true
      }).populate('studentId', 'fullName email department');

      console.log(`After population, found ${registrarForms.length} forms for Registrar with valid students`);

      pendingForms = pendingForms.concat(
        registrarForms.map(form => ({
          ...form.toObject(),
          formType: 'newClearance'
        }))
      );
    }

    // [...the rest of the function remains the same...]

    // Logging results
    console.log('Pending Forms Found:', {
      totalForms: pendingForms.length,
      formTypes: pendingForms.map(f => f.formType)
    });

    res.json({
      totalPendingForms: pendingForms.length,
      forms: pendingForms
    });
  } catch (error) {
    console.error('Error in getPendingForms:', error);
    res.status(500).json({ 
      message: 'Server error fetching pending forms',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
    const form = await Model.findById(formId);
    
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }
    
    // Get the student
    const student = await User.findById(form.studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Handle approval based on form type
    if (formType === 'newClearance') {
      // For New Clearance Form, we have specific approvals for Deputy Registrar and School Officer
      if (approvalType === 'deputyRegistrar') {
        form.deputyRegistrarApproved = true;
      } else if (approvalType === 'schoolOfficer') {
        form.schoolOfficerApproved = true;
      } else {
        return res.status(400).json({ message: 'Invalid approval type for New Clearance Form' });
      }
      
      // Set approval date if both approvals are complete
      if (form.deputyRegistrarApproved && form.schoolOfficerApproved) {
        form.approvedDate = Date.now();
        
        // Create notification for student that they can proceed with other forms
        const notification = new Notification({
          title: 'New Clearance Form Approved',
          description: 'Your New Clearance Form has been fully approved. You can now submit other forms and upload documents.',
          recipient: student._id,
          status: 'success',
          type: 'form_approval'
        });
        await notification.save();
      }
    } else if (formType === 'provAdmission') {
      // For Provisional Admission, we need specific staff approvals
      const approvalIndex = form.approvals.findIndex(a => a.staffRole === approvalType);
      
      if (approvalIndex === -1) {
        return res.status(400).json({ message: 'Invalid approval type for this form' });
      }
      
      // Update the approval
      form.approvals[approvalIndex].approved = true;
      form.approvals[approvalIndex].staffId = staffId;
      form.approvals[approvalIndex].approvedDate = Date.now();
      if (comments) {
        form.approvals[approvalIndex].comments = comments;
      }
      
      // Check if all approvals are complete
      const allApproved = form.approvals.every(approval => approval.approved);
      if (allApproved) {
        form.approved = true;
        form.approvedDate = Date.now();
        
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
      }
    } else {
      // For other forms, just a simple approval
      form.approved = true;
      form.approvedDate = Date.now();
      
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
    
    await form.save();
    
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
      approvalType
    });
  } catch (error) {
    console.error('Error approving form:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
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
  getStudentForms
  };