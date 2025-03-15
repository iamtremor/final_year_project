// backend/routes/clearanceRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { checkRole, checkRoles } = require('../middleware/roles');
const {
  getFormsStatus,
  submitNewClearanceForm,
  submitProvAdmissionForm,
  submitPersonalRecordForm,
  submitPersonalRecord2Form,
  submitAffidavitForm,
  approveForm,
  getFormById,
  getStudentForms,
  getPendingForms,
  getApprovedFormsByStaff, 
  getRejectedFormsByStaff 
} = require('../controllers/clearanceController');


// Student routes
router.get('/forms', auth, checkRole('student'), getFormsStatus);
router.post('/forms/new-clearance', auth, checkRole('student'), submitNewClearanceForm);
router.post('/forms/prov-admission', auth, checkRole('student'), submitProvAdmissionForm);
router.post('/forms/personal-record', auth, checkRole('student'), submitPersonalRecordForm);
router.post('/forms/personal-record2', auth, checkRole('student'), submitPersonalRecord2Form);
router.post('/forms/affidavit', auth, checkRole('student'), submitAffidavitForm);

// Staff approval routes - PUT THESE BEFORE THE GENERIC ROUTES
router.get('/forms/approved-by-me', auth, checkRole('staff'), getApprovedFormsByStaff);
router.get('/forms/rejected-by-me', auth, checkRole('staff'), getRejectedFormsByStaff);
router.get('/forms/pending', auth, checkRoles(['staff', 'admin']), getPendingForms);
router.get('/forms/student/:studentId', auth, checkRoles(['staff', 'admin']), getStudentForms);

// Form approval endpoint
router.post('/forms/:formId/approve', auth, checkRoles(['staff', 'admin']), approveForm);

// Get specific form - THIS MUST COME AFTER THE MORE SPECIFIC ROUTES
router.get('/forms/:formId', auth, getFormById);

module.exports = router;