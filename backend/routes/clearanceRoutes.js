// backend/routes/clearanceRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/roles');
const {
  submitNewClearanceForm,
  submitProvAdmissionForm,
  submitPersonalRecordForm,
  submitPersonalRecord2Form,
  submitAffidavitForm,
  getFormsStatus,
  approveForm
} = require('../controllers/clearanceController');

// Student routes
router.get('/forms', auth, getFormsStatus);
router.post('/forms/new-clearance', auth, checkRole('student'), submitNewClearanceForm);
router.post('/forms/prov-admission', auth, checkRole('student'), submitProvAdmissionForm);
router.post('/forms/personal-record', auth, checkRole('student'), submitPersonalRecordForm);
router.post('/forms/personal-record2', auth, checkRole('student'), submitPersonalRecord2Form);
router.post('/forms/affidavit', auth, checkRole('student'), submitAffidavitForm);

// Staff approval routes
router.post('/forms/:formId/approve', auth, checkRole('staff'), approveForm);

module.exports = router;