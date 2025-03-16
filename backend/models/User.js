// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'staff', 'admin'],
    required: true
  },
  // Common fields for both students and staff
  phoneNumber: {
    type: String,
    required: function() {
      return this.role === 'student' || this.role === 'staff';
    }
  },
  department: {
    type: String,
    required: function() {
      return this.role === 'student' || this.role === 'staff';
    }
  },
  dateOfBirth: {
    type: Date,
    required: function() {
      return this.role === 'student' || this.role === 'staff';
    }
  },
  // Student-specific fields
  applicationId: {
    type: String,
    required: function() {
      return this.role === 'student';
    },
    unique: function() {
      return this.role === 'student';
    }
  },
  // Staff-specific fields
  staffId: {
    type: String,
    required: function() {
      return this.role === 'staff';
    },
    unique: function() {
      return this.role === 'staff';
    }
  },
  // Admin-specific fields
  adminId: {
    type: String,
    required: function() {
      return this.role === 'admin';
    },
    unique: function() {
      return this.role === 'admin';
    }
  },
  managedDepartments: {
    type: [String],
    default: function() {
      // By default, a staff member manages only their own department
      return this.role === 'staff' ? [this.department] : [];
    }
  },
  // Blockchain transaction details
  blockchainTxHash: {
    type: String
  },
  blockchainBlockNumber: {
    type: Number
  },
  // Fields for retry mechanism
  blockchainRegistrationAttempts: {
    type: Number,
    default: 0
  },
  lastBlockchainRegistrationAttempt: {
    type: Date
  },
  blockchainRegistrationStatus: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending'
  },
  // User creation timestamp
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();  // Return here to stop further execution
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();  // Don't forget to call next() after hashing
});
// Compare entered password with hashed password
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);