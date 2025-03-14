// backend/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/roles');
const {
  getStudentDashboard,
  getStaffDashboard,
  getAdminDashboard
} = require('../controllers/dashboardController');

// Dashboard routes
router.get('/student', auth, checkRole('student'), getStudentDashboard);
router.get('/staff', auth, checkRole('staff'), getStaffDashboard);
router.get('/admin', auth, checkRole('admin'), getAdminDashboard);

module.exports = router;