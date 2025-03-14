const mongoose = require('mongoose');

const PersonalRecord2FormSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  parentGuardianName: {
    type: String,
    required: true
  },
  parentGuardianAddress: {
    type: String,
    required: true
  },
  parentGuardianOrigin: {
    type: String,
    required: true
  },
  parentGuardianCountry: {
    type: String,
    required: true
  },
  parentGuardianPhone: {
    type: String,
    required: true
  },
  parentGuardianEmail: {
    type: String
  },
  fatherName: {
    type: String
  },
  fatherAddress: {
    type: String
  },
  fatherPhone: {
    type: String
  },
  fatherOccupation: {
    type: String
  },
  motherName: {
    type: String
  },
  motherAddress: {
    type: String
  },
  motherPhone: {
    type: String
  },
  motherOccupation: {
    type: String
  },
  // Educational background
  educationHistory: [{
    schoolName: {
      type: String,
      required: true
    },
    schoolAddress: {
      type: String
    },
    startDate: {
      type: String
    },
    endDate: {
      type: String
    }
  }],
  qualifications: {
    type: String
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

module.exports = mongoose.model('PersonalRecord2Form', PersonalRecord2FormSchema);