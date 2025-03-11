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
  applicationId: {
    type: String,
    required: function() {
      return this.role === 'student';
    },
    unique: function() {
      return this.role === 'student';
    }
  },
  staffId: {
    type: String,
    required: function() {
      return this.role === 'staff';
    },
    unique: function() {
      return this.role === 'staff';
    }
  },
  adminId: {
    type: String,
    required: function() {
      return this.role === 'admin';
    },
    unique: function() {
      return this.role === 'admin';
    }
  },
  // Blockchain transaction details (for student registrations)
  blockchainTxHash: {
    type: String
  },
  blockchainBlockNumber: {
    type: Number
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
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare entered password with hashed password
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);