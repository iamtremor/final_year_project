const mongoose = require('mongoose');
const NewClearanceFormSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  jambRegNo: {
    type: String,
    required: true
  },
  oLevelQualification: Boolean,
  changeOfCourse: Boolean,
  changeOfInstitution: Boolean,
  uploadOLevel: Boolean,
  jambAdmissionLetter: Boolean,
  submitted: {
    type: Boolean,
    default: true  // Default to true when a form is created
  },
  // Add overall approval state
  approved: {
    type: Boolean,
    default: false
  },
  schoolOfficerApproved: {
    type: Boolean,
    default: false
  },
  schoolOfficerApprovedDate: Date,
  schoolOfficerApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  schoolOfficerComments: String,
  deputyRegistrarApproved: {
    type: Boolean,
    default: false
  },
  deputyRegistrarApprovedDate: Date,
  deputyRegistrarApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deputyRegistrarComments: String,
  submittedDate: {
    type: Date,
    default: Date.now
  },
  approvedDate: Date,
  // Add blockchain tracking fields
  blockchainTxHash: String,
  blockchainBlockNumber: Number
});

module.exports = mongoose.model('NewClearanceForm', NewClearanceFormSchema);