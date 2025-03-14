const mongoose = require('mongoose');

const PersonalRecordFormSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fullName: {
    type: String,
    required: true
  },
  matricNo: {
    type: String
  },
  schoolFaculty: {
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
  gender: {
    type: String,
    enum: ['Male', 'Female'],
    required: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  maritalStatus: {
    type: String,
    enum: ['Single', 'Married'],
    required: true
  },
  religion: {
    type: String
  },
  church: {
    type: String
  },
  bloodGroup: {
    type: String
  },
  homeTown: {
    type: String
  },
  stateOfOrigin: {
    type: String,
    required: true
  },
  nationality: {
    type: String,
    required: true
  },
  homeAddress: {
    type: String,
    required: true
  },
  nextOfKin: {
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

module.exports = mongoose.model('PersonalRecordForm', PersonalRecordFormSchema);