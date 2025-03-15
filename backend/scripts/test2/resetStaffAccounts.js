// Save as resetStaffPassword.js
const mongoose = require('mongoose');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const config = require('../../config');

async function resetPassword() {
  try {
    // Connect to database
    await mongoose.connect(config.database.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to database');
    
    // Find staff by ID
    const staffId = 'REG001';
    const newPassword = 'password123';
    
    const staff = await User.findOne({ staffId, role: 'staff' });
    
    if (!staff) {
      console.error(`Staff with ID ${staffId} not found`);
      return;
    }
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    staff.password = await bcrypt.hash(newPassword, salt);
    
    // Save the updated staff record
    await staff.save();
    
    console.log(`Password reset for ${staff.fullName} (${staffId})`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

resetPassword();