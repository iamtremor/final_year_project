const mongoose = require('mongoose');

const AffidavitFormSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  faculty: {
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
  agreementDate: {
    type: Date,
    required: true
  },
  signature: {
    type: String,
    required: true
  },
  submitted: {
    type: Boolean,
    default: false
  },
  submittedDate: Date,
  approved: {
    type: Boolean,
    default: false
  },
  approvedDate: Date
});

module.exports = mongoose.model('AffidavitForm', AffidavitFormSchema);