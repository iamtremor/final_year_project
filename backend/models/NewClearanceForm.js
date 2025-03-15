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
  schoolOfficerApproved: {
    type: Boolean,
    default: false
  },
  deputyRegistrarApproved: {
    type: Boolean,
    default: false
  },
  submittedDate: {
    type: Date,
    default: Date.now
  },
  approvedDate: Date
});

module.exports = mongoose.model('NewClearanceForm', NewClearanceFormSchema);