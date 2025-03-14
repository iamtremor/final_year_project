// backend/models/ClearanceForm.js (example)
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
  // Other form fields
  oLevelQualification: Boolean,
  changeOfCourse: Boolean,
  changeOfInstitution: Boolean,
  uploadOLevel: Boolean,
  jambAdmissionLetter: Boolean,
  // Approval fields
  submitted: {
    type: Boolean,
    default: false
  },
  schoolOfficerApproved: {
    type: Boolean,
    default: false
  },
  deputyRegistrarApproved: {
    type: Boolean,
    default: false
  },
  approvedDate: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create similar schemas for other forms