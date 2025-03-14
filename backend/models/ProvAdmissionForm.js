const mongoose = require('mongoose');

const ProvAdmissionFormSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  course: {
    type: String,
    required: true
  },
  // Track approvals from different staff
  approvals: [{
    staffRole: {
      type: String,
      required: true
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approved: {
      type: Boolean,
      default: false
    },
    approvedDate: Date,
    comments: String
  }],
  submitted: {
    type: Boolean,
    default: false
  },
  submittedDate: {
    type: Date
  },
  approved: {
    type: Boolean,
    default: false
  },
  approvedDate: Date
});

module.exports = mongoose.model('ProvAdmissionForm', ProvAdmissionFormSchema);