// backend/models/Notification.js
const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['success', 'warning', 'error', 'info'],
    default: 'info'
  },
  type: {
    type: String,
    enum: [
      'document_approval',
      'document_rejection',
      'document_upload',
      'document_deletion',
      'deadline_reminder',
      'announcement',
      'general',
      'form_approval',  // Add this line
      'form_submission'  // Make sure this is also included
    ],
    default: 'general'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: false
  },
  documentName: {
    type: String,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notification', NotificationSchema);