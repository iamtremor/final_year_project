// Save as backend/scripts/verifyAllStudents.js

const mongoose = require('mongoose');
const User = require('../models/User');
const blockchainService = require('../services/blockchainService');
const config = require('../config');

async function verifyAllStudents() {
  try {
    // Connect to database
    await mongoose.connect(config.database.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');
    
    // Find all students with success registration status
    const registeredStudents = await User.find({
      role: 'student',
      blockchainRegistrationStatus: 'success'
    });
    
    console.log(`Found ${registeredStudents.length} registered students to verify`);
    
    // Process each student
    let successCount = 0;
    let alreadyVerifiedCount = 0;
    let failureCount = 0;
    
    for (const student of registeredStudents) {
      try {
        console.log(`\nProcessing student: ${student.fullName} (${student.applicationId})`);
        
        // Check current blockchain status
        console.log('Checking current blockchain status...');
        const blockchainStatus = await blockchainService.getStudentStatus(student.applicationId);
        
        if (!blockchainStatus.exists) {
          console.log(`Student ${student.applicationId} does not exist on blockchain yet`);
          console.log('Skipping verification...');
          continue;
        }
        
        if (blockchainStatus.verified) {
          console.log(`Student ${student.applicationId} is already verified on blockchain`);
          alreadyVerifiedCount++;
          continue;
        }
        
        // Verify the student
        console.log(`Verifying student ${student.applicationId} on blockchain...`);
        const result = await blockchainService.verifyStudent(student.applicationId);
        
        console.log('Verification transaction hash:', result.transactionHash);
        console.log('Verification successful!');
        
        // Check updated status
        const updatedStatus = await blockchainService.getStudentStatus(student.applicationId);
        console.log('Updated blockchain status:', updatedStatus);
        
        if (updatedStatus.verified) {
          console.log('Verification confirmed on blockchain');
          successCount++;
        } else {
          console.log('Warning: Verification transaction sent but student still shows as unverified');
          failureCount++;
        }
      } catch (error) {
        console.error(`Error verifying student ${student.applicationId}:`, error);
        failureCount++;
      }
    }
    
    console.log('\nVerification process completed:');
    console.log(`- Successfully verified: ${successCount}`);
    console.log(`- Already verified: ${alreadyVerifiedCount}`);
    console.log(`- Failed verification: ${failureCount}`);
    
  } catch (error) {
    console.error('Error in verification process:', error);
  } finally {
    // Disconnect from database
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
verifyAllStudents()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });