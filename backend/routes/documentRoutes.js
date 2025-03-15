// backend/routes/documentRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { 
  uploadDocument, 
  getStudentDocuments, 
  getDocumentById,
  downloadDocument,
  updateDocumentStatus,
  getPendingDocuments,
  getAllDocuments,
  deleteDocument,
  getApprovableDocuments,
  getCompletedClearances,
  getApprovedDocumentsByStaff,
  getRejectedDocumentsByStaff
} = require('../controllers/documentController');
const auth = require('../middleware/auth');
const { checkRole, checkRoles } = require('../middleware/roles');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Student routes
router.post('/upload', auth, checkRole('student'), upload.single('file'), uploadDocument);
router.get('/student', auth, checkRole('student'), getStudentDocuments);

// Staff routes - SPECIFIC NAMED ROUTES FIRST
router.get('/pending', auth, checkRole('staff'), getPendingDocuments);
router.get('/staff/approvable', auth, checkRoles(['staff', 'admin']), getApprovableDocuments);
router.get('/approved-by-me', auth, checkRole('staff'), getApprovedDocumentsByStaff);
router.get('/rejected-by-me', auth, checkRole('staff'), getRejectedDocumentsByStaff);

// Admin routes - SPECIFIC NAMED ROUTES
router.get('/all', auth, checkRole('admin'), getAllDocuments);
router.get('/clearance/completed', auth, checkRole('admin'), getCompletedClearances);

// GENERIC PARAMETER ROUTES LAST
router.get('/download/:id', auth, downloadDocument);
router.get('/:id', auth, getDocumentById);
router.delete('/:id', auth, deleteDocument);
router.put('/:id/status', auth, checkRoles(['staff', 'admin']), updateDocumentStatus);

module.exports = router;