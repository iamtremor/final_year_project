// backend/controllers/dashboardController.js
const User = require('../models/User');
const Document = require('../models/Document');
const NewClearanceForm = require('../models/NewClearanceForm');
const ProvAdmissionForm = require('../models/ProvAdmissionForm');
const PersonalRecordForm = require('../models/PersonalRecordForm');
const PersonalRecord2Form = require('../models/PersonalRecord2Form');
const AffidavitForm = require('../models/AffidavitForm');
const Notification = require('../models/Notification');

/**
 * Get dashboard data for students
 * @route   GET /api/dashboard/student
 * @access  Private (Student)
 */
const getStudentDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get clearance progress
    const clearanceStatus = await getStudentClearanceStatus(userId);
    
    // Calculate completion percentage
    const completionPercentage = calculateCompletionPercentage(clearanceStatus);
    
    // Get recent notifications
    const notifications = await Notification.find({ 
      recipient: userId 
    })
    .sort({ createdAt: -1 })
    .limit(5);
    
    // Get recent documents
    const documents = await Document.find({ owner: userId })
      .sort({ createdAt: -1 })
      .limit(5);
    
    res.json({
      clearanceStatus,
      completionPercentage,
      notifications,
      recentDocuments: documents
    });
  } catch (error) {
    console.error('Error fetching student dashboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get dashboard data for staff
 * @route   GET /api/dashboard/staff
 * @access  Private (Staff)
 */
const getStaffDashboard = async (req, res) => {
  try {
    const staffId = req.user._id;
    
    // Get stats based on staff role and department
    const stats = await getStaffStats(req.user);
    
    // Get recent notifications
    const notifications = await Notification.find({ 
      recipient: staffId 
    })
    .sort({ createdAt: -1 })
    .limit(5);
    
    // Get pending items that need staff attention
    const pendingItems = await getPendingItems(req.user);
    
    res.json({
      stats,
      notifications,
      pendingItems
    });
  } catch (error) {
    console.error('Error fetching staff dashboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get dashboard data for admin
 * @route   GET /api/dashboard/admin
 * @access  Private (Admin)
 */
const getAdminDashboard = async (req, res) => {
  try {
    // Get overall system stats
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalStaff = await User.countDocuments({ role: 'staff' });
    const totalDocuments = await Document.countDocuments();
    const approvedDocuments = await Document.countDocuments({ status: 'approved' });
    const pendingDocuments = await Document.countDocuments({ status: 'pending' });
    const rejectedDocuments = await Document.countDocuments({ status: 'rejected' });
    
    // Get clearance stats
    const students = await User.find({ role: 'student' });
    let completedClearances = 0;
    let partialClearances = 0;
    let notStartedClearances = 0;
    
    for (const student of students) {
      const hasStarted = await NewClearanceForm.exists({ studentId: student._id });
      
      if (hasStarted) {
        const clearanceStatus = await getStudentClearanceStatus(student._id);
        if (clearanceStatus.clearanceComplete) {
          completedClearances++;
        } else {
          partialClearances++;
        }
      } else {
        notStartedClearances++;
      }
    }
    
    // Get department stats
    const departments = await User.distinct('department', { role: 'student' });
    const departmentStats = [];
    
    for (const department of departments) {
      const studentsInDept = await User.countDocuments({ 
        role: 'student', 
        department 
      });
      
      departmentStats.push({
        department,
        students: studentsInDept
      });
    }
    
    res.json({
      userStats: {
        totalStudents,
        totalStaff
      },
      documentStats: {
        total: totalDocuments,
        approved: approvedDocuments,
        pending: pendingDocuments,
        rejected: rejectedDocuments
      },
      clearanceStats: {
        completed: completedClearances,
        partial: partialClearances,
        notStarted: notStartedClearances
      },
      departmentStats
    });
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
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
      id: doc ? doc._id : null,
      uploadDate: doc ? doc.createdAt : null,
      approvalDate: doc && doc.status === 'approved' ? doc.reviewDate : null
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
  
  // Calculate document completion stats
  const totalDocuments = requiredDocumentTypes.length;
  const uploadedDocuments = Object.values(documentStatus).filter(doc => doc.uploaded).length;
  const approvedDocuments = Object.values(documentStatus).filter(doc => doc.approved).length;
  
  // Calculate form completion stats
  const totalForms = 5; // New Clearance, Prov Admission, Personal Record, Personal Record 2, Affidavit
  const submittedForms = (newClearanceForm ? 1 : 0) + 
    (provAdmissionForm && provAdmissionForm.submitted ? 1 : 0) +
    (personalRecordForm && personalRecordForm.submitted ? 1 : 0) +
    (personalRecord2Form && personalRecord2Form.submitted ? 1 : 0) +
    (affidavitForm && affidavitForm.submitted ? 1 : 0);
  const approvedForms = (newClearanceApproved ? 1 : 0) +
    (provAdmissionForm && provAdmissionForm.approved ? 1 : 0) +
    (personalRecordForm && personalRecordForm.approved ? 1 : 0) +
    (personalRecord2Form && personalRecord2Form.approved ? 1 : 0) +
    (affidavitForm && affidavitForm.approved ? 1 : 0);
  
  const clearanceComplete = allFormsSubmitted && allFormsApproved && allDocumentsApproved;
  
  return {
    forms: {
      newClearance: {
        submitted: !!newClearanceForm,
        deputyRegistrarApproved: newClearanceForm ? newClearanceForm.deputyRegistrarApproved : false,
        schoolOfficerApproved: newClearanceForm ? newClearanceForm.schoolOfficerApproved : false,
        approved: newClearanceApproved,
        submittedDate: newClearanceForm ? newClearanceForm.submittedDate : null,
        approvedDate: newClearanceForm && newClearanceApproved ? newClearanceForm.approvedDate : null
      },
      provAdmission: {
        submitted: provAdmissionForm ? provAdmissionForm.submitted : false,
        approved: provAdmissionForm ? provAdmissionForm.approved : false,
        submittedDate: provAdmissionForm ? provAdmissionForm.submittedDate : null,
        approvedDate: provAdmissionForm ? provAdmissionForm.approvedDate : null,
        approvals: provAdmissionForm ? provAdmissionForm.approvals : []
      },
      personalRecord: {
        submitted: personalRecordForm ? personalRecordForm.submitted : false,
        approved: personalRecordForm ? personalRecordForm.approved : false,
        submittedDate: personalRecordForm ? personalRecordForm.submittedDate : null,
        approvedDate: personalRecordForm ? personalRecordForm.approvedDate : null
      },
      personalRecord2: {
        submitted: personalRecord2Form ? personalRecord2Form.submitted : false,
        approved: personalRecord2Form ? personalRecord2Form.approved : false,
        submittedDate: personalRecord2Form ? personalRecord2Form.submittedDate : null,
        approvedDate: personalRecord2Form ? personalRecord2Form.approvedDate : null
      },
      affidavit: {
        submitted: affidavitForm ? affidavitForm.submitted : false,
        approved: affidavitForm ? affidavitForm.approved : false,
        submittedDate: affidavitForm ? affidavitForm.submittedDate : null,
        approvedDate: affidavitForm ? affidavitForm.approvedDate : null
      }
    },
    documents: documentStatus,
    stats: {
      forms: {
        total: totalForms,
        submitted: submittedForms,
        approved: approvedForms
      },
      documents: {
        total: totalDocuments,
        uploaded: uploadedDocuments,
        approved: approvedDocuments
      }
    },
    allFormsSubmitted,
    allFormsApproved,
    allDocumentsApproved,
    clearanceComplete
  };
};

/**
 * Calculate completion percentage for clearance process
 * @param {Object} clearanceStatus - Clearance status object
 * @returns {number} - Completion percentage
 */
const calculateCompletionPercentage = (clearanceStatus) => {
  // We'll calculate based on both forms and documents
  // Forms: 50% of total weight
  // Documents: 50% of total weight
  
  const formStats = clearanceStatus.stats.forms;
  const documentStats = clearanceStatus.stats.documents;
  
  // Form completion (submitted + approved)
  // Submission is 1/3 of form weight, approval is 2/3
  const formSubmissionPercent = (formStats.submitted / formStats.total) * 100 * (1/3);
  const formApprovalPercent = (formStats.approved / formStats.total) * 100 * (2/3);
  const formPercent = (formSubmissionPercent + formApprovalPercent) * 0.5;
  
  // Document completion (uploaded + approved)
  // Upload is 1/3 of document weight, approval is 2/3
  const docUploadPercent = (documentStats.uploaded / documentStats.total) * 100 * (1/3);
  const docApprovalPercent = (documentStats.approved / documentStats.total) * 100 * (2/3);
  const docPercent = (docUploadPercent + docApprovalPercent) * 0.5;
  
  // Overall percentage
  return Math.round(formPercent + docPercent);
};

/**
 * Get staff-specific statistics based on their role and department
 * @param {Object} staff - Staff user object
 * @returns {Object} - Staff-specific stats
 */
const getStaffStats = async (staff) => {
  const department = staff.department;
  const staffId = staff._id;
  
  // Initialize stats
  const stats = {
    pendingApprovals: {
      forms: 0,
      documents: 0
    },
    completedApprovals: {
      forms: 0,
      documents: 0
    },
    studentsInDepartment: 0
  };
  
  // Get students in the department (for academic staff)
  if (!['Registrar', 'Student Support', 'Finance', 'Health Services', 'Library'].includes(department)) {
    // For academic departments, count students they manage
    if (staff.managedDepartments && staff.managedDepartments.length > 0) {
      stats.studentsInDepartment = await User.countDocuments({ 
        role: 'student', 
        department: { $in: staff.managedDepartments }
      });
    } else {
      // Default to their own department
      stats.studentsInDepartment = await User.countDocuments({ 
        role: 'student', 
        department: department.replace(' HOD', '') // Remove HOD if present
      });
    }
  }
  
  // Count pending document approvals based on staff role
  let documentFilter = {};
  let studentFilter = {};
  
  switch (department) {
    case 'Registrar':
      documentFilter = { documentType: 'Admission Letter' };
      break;
    case 'Student Support':
      documentFilter = { documentType: { $in: ['Birth Certificate', 'Passport'] } };
      break;
    case 'Finance':
      documentFilter = { documentType: 'Payment Receipt' };
      break;
    case 'Health Services':
      documentFilter = { documentType: 'Medical Report' };
      break;
    default:
      // For academic departments/school officers
      if (department.includes('HOD')) {
        documentFilter = { documentType: 'Transcript' };
        // Get only students in their department
        const departmentWithoutHOD = department.replace(' HOD', '');
        studentFilter = { department: departmentWithoutHOD };
      } else if (staff.managedDepartments && staff.managedDepartments.length > 0) {
        // School officer with managed departments
        documentFilter = { documentType: { $in: ['JAMB Result', 'JAMB Admission', 'WAEC'] } };
        studentFilter = { department: { $in: staff.managedDepartments } };
      }
  }
  
  // Apply student filter to document filter if needed
  if (Object.keys(studentFilter).length > 0) {
    const students = await User.find({ role: 'student', ...studentFilter });
    const studentIds = students.map(s => s._id);
    documentFilter.owner = { $in: studentIds };
  }
  
  // Count pending document approvals
  if (Object.keys(documentFilter).length > 0) {
    stats.pendingApprovals.documents = await Document.countDocuments({
      ...documentFilter,
      status: 'pending'
    });
    
    stats.completedApprovals.documents = await Document.countDocuments({
      ...documentFilter,
      status: 'approved',
      reviewedBy: staffId
    });
  }
  
  // Count pending form approvals
  if (department === 'Registrar') {
    // For Deputy Registrar: Count New Clearance Forms needing their approval
    stats.pendingApprovals.forms = await NewClearanceForm.countDocuments({
      deputyRegistrarApproved: false,
      submitted: true
    });
    
    // Count forms approved by this staff member
    stats.completedApprovals.forms = await NewClearanceForm.countDocuments({
      deputyRegistrarApproved: true,
      // We need a way to track which staff approved - this might need schema update
      // For now, just count all approved forms
    });
  } else if (!department.includes('HOD') && 
             !['Registrar', 'Student Support', 'Finance', 'Health Services', 'Library'].includes(department)) {
    // For School Officer: Count forms needing their approval
    
    // Get students in managed departments
    let studentIds = [];
    if (staff.managedDepartments && staff.managedDepartments.length > 0) {
      const students = await User.find({ 
        role: 'student', 
        department: { $in: staff.managedDepartments } 
      });
      studentIds = students.map(s => s._id);
    }
    
    if (studentIds.length > 0) {
      // Count New Clearance Forms for these students that need School Officer approval
      stats.pendingApprovals.forms = await NewClearanceForm.countDocuments({
        studentId: { $in: studentIds },
        deputyRegistrarApproved: true,
        schoolOfficerApproved: false,
        submitted: true
      });
      
      // Count forms approved by this School Officer
      stats.completedApprovals.forms = await NewClearanceForm.countDocuments({
        studentId: { $in: studentIds },
        schoolOfficerApproved: true
      });
    }
  }
  
  // Count Provisional Admission forms based on staff role
  const staffRole = getStaffRoleFromDepartment(department);
  
  // Count pending Provisional Admission forms
  const provPendingCount = await ProvAdmissionForm.countDocuments({
  submitted: true,
  'approvals.staffRole': staffRole,
  'approvals.approved': false,
  'approvals': {
    $not: {
      $elemMatch: {
        staffRole: staffRole,
        staffId: staffId,
        approved: true
      }
    }
  }
});
  
  stats.pendingApprovals.forms += provPendingCount;
  
  // Count approved Provisional Admission forms
  const provApprovedCount = await ProvAdmissionForm.countDocuments({
    'approvals.staffRole': staffRole,
    'approvals.staffId': staffId,
    'approvals.approved': true
  });
  
  stats.completedApprovals.forms += provApprovedCount;
  
  return stats;
};

/**
 * Get items that need staff attention (pending approvals)
 * @param {Object} staff - Staff user object
 * @returns {Object} - Pending items grouped by type
 */
const getPendingItems = async (staff) => {
  const department = staff.department;
  const pendingItems = {
    forms: [],
    documents: []
  };
  
  console.log("Getting pending items for staff:", {
    staffId: staff._id,
    staffName: staff.fullName,
    department: staff.department,
    managedDepartments: staff.managedDepartments || []
  });
  
  // Get pending forms
  if (department === 'Registrar') {
    // Get New Clearance Forms needing Deputy Registrar approval
    const pendingForms = await NewClearanceForm.find({
      deputyRegistrarApproved: false
    }).populate('studentId', 'fullName email department');
    
    pendingItems.forms.push(...pendingForms.map(form => ({
      id: form._id,
      type: 'newClearance',
      formName: 'New Clearance Form',
      studentName: form.studentId.fullName,
      studentDepartment: form.studentId.department,
      submittedDate: form.submittedDate
    })));
  } else if (department === 'School Officer' && staff.managedDepartments && staff.managedDepartments.length > 0) {
    // Get New Clearance Forms needing School Officer approval
    // Find students in these departments
    const studentsInManagedDepts = await User.find({ 
      role: 'student', 
      department: { $in: staff.managedDepartments }
    });
    
    const studentIds = studentsInManagedDepts.map(s => s._id);
    
    console.log(`School Officer manages departments: ${staff.managedDepartments.join(', ')}`);
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
      
      pendingItems.forms.push(...schoolOfficerForms.map(form => ({
        id: form._id,
        type: 'newClearance',
        formName: 'New Clearance Form',
        studentName: form.studentId?.fullName || form.studentName,
        studentDepartment: form.studentId?.department,
        submittedDate: form.submittedDate
      })));
      
      // Also get Provisional Admission Forms that need School Officer approval
      const staffRole = 'schoolOfficer';
const pendingProvForms = await ProvAdmissionForm.find({
  studentId: { $in: studentIds },
  submitted: true,
  approved: false,
  'approvals.staffRole': staffRole,
  'approvals.approved': false,
  // Exclude forms where this staff has already approved
  'approvals': {
    $not: {
      $elemMatch: {
        staffRole: staffRole,
        staffId: staff._id,
        approved: true
      }
    }
  }
}).populate('studentId', 'fullName email department');
      
      console.log(`Found ${pendingProvForms.length} provisional admission forms pending School Officer approval`);
      
      pendingItems.forms.push(...pendingProvForms.map(form => ({
        id: form._id,
        type: 'provAdmission',
        formName: 'Provisional Admission Form',
        studentName: form.studentId?.fullName || form.studentName,
        studentDepartment: form.studentId?.department,
        submittedDate: form.submittedDate
      })));
    }
  } else if (department.includes('HOD')) {
    // For Department Heads (HOD)
    const departmentName = department.replace(' HOD', '');
    
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
      
      pendingItems.forms.push(...pendingProvForms.map(form => ({
        id: form._id,
        type: 'provAdmission',
        formName: 'Provisional Admission Form',
        studentName: form.studentId?.fullName || form.studentName,
        studentDepartment: form.studentId?.department,
        submittedDate: form.submittedDate
      })));
    }
  }
  
  // Get other form types needed for other staff roles

  // Get pending documents based on staff role
  let documentFilter = {};
  
  // Special handling for School Officer
  if (department === 'School Officer') {
    documentFilter = { documentType: { $in: ['JAMB Result', 'JAMB Admission', 'WAEC'] } };
    
    // For school officers, only count students in their managed departments
    if (staff.managedDepartments && staff.managedDepartments.length > 0) {
      const studentsInManagedDepts = await User.find({ 
        role: 'student', 
        department: { $in: staff.managedDepartments } 
      });
      
      const studentIds = studentsInManagedDepts.map(s => s._id);
      console.log(`Found ${studentIds.length} students in managed departments for School Officer`);
      
      if (studentIds.length > 0) {
        documentFilter.owner = { $in: studentIds };
      }
    }
  } else {
    switch (department) {
      case 'Registrar':
        documentFilter = { documentType: 'Admission Letter' };
        break;
      case 'Student Support':
        documentFilter = { documentType: { $in: ['Birth Certificate', 'Passport'] } };
        break;
      case 'Finance':
        documentFilter = { documentType: 'Payment Receipt' };
        break;
      case 'Health Services':
        documentFilter = { documentType: 'Medical Report' };
        break;
      default:
        // For academic departments
        if (department.includes('HOD')) {
          documentFilter = { documentType: 'Transcript' };
          
          // For HOD, only count students in their department
          const departmentWithoutHOD = department.replace(' HOD', '');
          const studentsInDept = await User.find({ 
            role: 'student', 
            department: departmentWithoutHOD 
          });
          
          const studentIds = studentsInDept.map(s => s._id);
          documentFilter.owner = { $in: studentIds };
        }
    }
  }
  
  console.log("Document filter for pending items:", documentFilter);
  
  // Get pending documents
  if (Object.keys(documentFilter).length > 0) {
    documentFilter.status = 'pending'; // Add status to the filter
    
    const pendingDocs = await Document.find(documentFilter)
      .populate('owner', 'fullName email department');
    
    console.log(`Found ${pendingDocs.length} pending documents for dashboard`);
    
    pendingItems.documents.push(...pendingDocs.map(doc => ({
      id: doc._id,
      type: doc.documentType,
      title: doc.title,
      studentName: doc.owner?.fullName || 'Unknown',
      studentDepartment: doc.owner?.department || 'Unknown',
      uploadedDate: doc.createdAt
    })));
  }
  
  return pendingItems;
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

module.exports = {
  getStudentDashboard,
  getStaffDashboard,
  getAdminDashboard,
  getStudentClearanceStatus,
  calculateCompletionPercentage,
  getStaffStats,
  getPendingItems,
  getStaffRoleFromDepartment,
};