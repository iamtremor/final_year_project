// backend/routes/documentRoutes.js - updated with DELETE route
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
  deleteDocument  // Add this import
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
router.get('/:id', auth, getDocumentById);
router.get('/download/:id', auth, downloadDocument);
router.delete('/:id', auth, deleteDocument);  // Add this route

// Staff routes
router.get('/pending', auth, checkRole('staff'), getPendingDocuments);
router.put('/:id/status', auth, checkRoles(['staff', 'admin']), updateDocumentStatus);

// Admin routes
router.get('/all', auth, checkRole('admin'), getAllDocuments);

module.exports = router;