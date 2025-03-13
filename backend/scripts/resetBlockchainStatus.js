// Save as backend/scripts/resetBlockchainStatus.js

const mongoose = require('mongoose');
const User = require('../models/User');
const config = require('../config');

async function resetBlockchainStatus() {
  try {
    // Connect to database
    await mongoose.connect(config.database.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to database');
    
    // Find all users
    const users = await User.find({});
    console.log(`Found ${users.length} users total`);
    
    // Count users with blockchainTxHash
    const usersWithHash = users.filter(u => u.blockchainTxHash).length;
    console.log(`${usersWithHash} users have blockchainTxHash set`);
    
    // Find test student by application ID
    const testStudent = await User.findOne({ applicationId: '140456' });
    if (testStudent) {
      console.log('Test student details:');
      console.log('  Application ID:', testStudent.applicationId);
      console.log('  Blockchain TX Hash:', testStudent.blockchainTxHash);
      console.log('  Registration Status:', testStudent.blockchainRegistrationStatus);
    }
    
    // Update student with ID different from 140456 to have null blockchain values
    const updateResult = await User.updateMany(
      { 
        role: 'student', 
        applicationId: { $ne: '140456' } 
      },
      { 
        $set: { 
          blockchainTxHash: null,
          blockchainRegistrationStatus: 'pending',
          blockchainRegistrationAttempts: 0
        } 
      }
    );
    
    console.log('Reset blockchain status for students:', updateResult);
    
    // Show students after reset
    const studentsAfterReset = await User.find({ role: 'student' });
    studentsAfterReset.forEach(student => {
      console.log(`Student ${student.applicationId}: txHash=${student.blockchainTxHash}, status=${student.blockchainRegistrationStatus}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

resetBlockchainStatus().catch(console.error);