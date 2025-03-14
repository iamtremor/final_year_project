// backend/models/Document.js
const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false,
    default: ''
  },
  documentType: {
    type: String,
    required: true
  },
  filePath: {
    type: String
  },
  fileName: {
    type: String
  },
  fileSize: {
    type: Number
  },
  mimeType: {
    type: String
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  feedback: {
    type: String
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewDate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // Document hash (stored when uploaded, used for verification before adding to blockchain)
  documentHash: {
    type: String
  },
  // Blockchain transaction details (added only when approved)
  blockchainTxHash: {
    type: String
  },
  blockchainBlockNumber: {
    type: Number
  },
  blockchainTimestamp: {
    type: Date
  },
  // Add this to the existing Document schema
documentCategory: {
  type: String,
  enum: [
    'Admission Letter', 
    'JAMB Result', 
    'JAMB Admission', 
    'WAEC',
    'Birth Certificate',
    'Payment Receipt',
    'Medical Report',
    'Passport',
    'Transcript'
  ],
  required: true
},
approverRole: {
  type: String,
  enum: [
    'schoolOfficer',
    'deputyRegistrar',
    'departmentHead',
    'studentSupport',
    'admin'
  ]
}
});

module.exports = mongoose.model('Document', DocumentSchema);