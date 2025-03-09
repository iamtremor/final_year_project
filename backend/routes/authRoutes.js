const express = require('express');
const router = express.Router();
const {
  registerStudent,
  registerStaff,
  registerAdmin,
  loginStudent,
  loginStaff,
  loginAdmin
} = require('../controllers/authController');

// Student routes
router.post('/student/register', registerStudent);
router.post('/student/login', loginStudent);

// Staff routes
router.post('/staff/register', registerStaff);
router.post('/staff/login', loginStaff);

// Admin routes
router.post('/admin/register', registerAdmin);
router.post('/admin/login', loginAdmin);

module.exports = router;
