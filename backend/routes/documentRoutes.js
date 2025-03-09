// backend/routes/documentRoutes.js
const express = require('express');
const router = express.Router();
const { 
  uploadDocument, 
  getStudentDocuments, 
  getDocumentById,
  updateDocumentStatus 
} = require('../controllers/documentController');
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/roles');

// Student routes
router.post('/upload', auth, checkRole('student'), uploadDocument);
router.get('/student', auth, checkRole('student'), getStudentDocuments);
router.get('/:id', auth, getDocumentById);
// In your backend routes/documentRoutes.js
router.get('/student', auth, async (req, res) => {
  try {
    // Get all documents for the authenticated student
    const documents = await Document.find({ owner: req.user._id });
    res.json(documents);
  } catch (error) {
    console.error('Error fetching student documents:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// Staff routes
// router.get('/pending', auth, checkRole('staff'), getPendingDocuments);
// router.put('/:id/status', auth, checkRole('staff'), updateDocumentStatus);

// // Admin routes
// router.get('/all', auth, checkRole('admin'), getAllDocuments);

module.exports = router;