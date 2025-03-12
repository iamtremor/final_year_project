// Create a script to update existing users with blockchain fields
// Save this as backend/scripts/updateUserBlockchainFields.js

const mongoose = require('mongoose');
const config = require('../config');
const User = require('../models/User');

async function updateUsers() {
  try {
    // Connect to database
    await mongoose.connect(config.database.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to database');
    
    // Find all student users
    const students = await User.find({ role: 'student' });
    console.log(`Found ${students.length} student users`);
    
    // Update each student
    let updatedCount = 0;
    for (const student of students) {
      let updated = false;
      
      // Set default values if they don't exist
      if (student.blockchainRegistrationStatus === undefined) {
        student.blockchainRegistrationStatus = 'pending';
        updated = true;
      }
      
      if (student.blockchainRegistrationAttempts === undefined) {
        student.blockchainRegistrationAttempts = 0;
        updated = true;
      }
      
      if (student.lastBlockchainRegistrationAttempt === undefined) {
        student.lastBlockchainRegistrationAttempt = new Date();
        updated = true;
      }
      
      // Save the updated student
      if (updated) {
        await student.save();
        updatedCount++;
      }
    }
    
    console.log(`Updated ${updatedCount} students with blockchain fields`);
    
    // Verify User model has required blockchain fields
    const userSchema = User.schema;
    console.log('User schema contains:');
    console.log('blockchainTxHash:', !!userSchema.paths.blockchainTxHash);
    console.log('blockchainRegistrationStatus:', !!userSchema.paths.blockchainRegistrationStatus);
    console.log('blockchainRegistrationAttempts:', !!userSchema.paths.blockchainRegistrationAttempts);
    
    if (!userSchema.paths.blockchainRegistrationStatus) {
      console.error('WARNING: User schema is missing blockchainRegistrationStatus field!');
      console.log('You may need to update your User model definition in models/User.js');
    }
    
  } catch (error) {
    console.error('Error updating users:', error);
  } finally {
    // Disconnect from database
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

// Run the update function
updateUsers().catch(console.error);

// To run this script:
// node scripts/updateUserBlockchainFields.js