// Save as backend/scripts/runEnhancedRegistrationJob.js

const mongoose = require('mongoose');
const User = require('../models/User');
const blockchainService = require('../services/blockchainService');
const config = require('../config');

async function registerStudent(student) {
  try {
    console.log(`\nProcessing student: ${student.fullName} (${student.applicationId})`);
    
    // Check if already exists on blockchain
    console.log('Checking if student exists on blockchain...');
    const blockchainStatus = await blockchainService.getStudentStatus(student.applicationId);
    
    if (blockchainStatus.exists) {
      console.log(`Student ${student.applicationId} already exists on blockchain`);
      
      // Update DB record if needed
      if (student.blockchainRegistrationStatus !== 'success') {
        student.blockchainRegistrationStatus = 'success';
        student.blockchainTxHash = blockchainStatus.dataHash || 'found_on_blockchain';
        await student.save();
        console.log('Updated database record to match blockchain');
      }
      
      return {
        success: true,
        alreadyRegistered: true,
        applicationId: student.applicationId
      };
    }
    
    // If not on blockchain, register the student
    console.log(`Registering student ${student.applicationId} on blockchain...`);
    
    // Create student data for blockchain
    const studentData = {
      fullName: student.fullName,
      email: student.email,
      applicationId: student.applicationId,
      registrationTimestamp: new Date().toISOString()
    };
    
    // Log the student data being sent
    console.log('Student data for blockchain:', JSON.stringify(studentData));
    
    // Explicitly set high gas limit for this call
    console.log('Sending transaction with high gas limit...');
    const blockchainResult = await blockchainService.registerStudent(student.applicationId, studentData);
    
    console.log('Registration successful:', blockchainResult);
    
    // Update student record with blockchain info
    student.blockchainTxHash = blockchainResult.transactionHash;
    student.blockchainBlockNumber = blockchainResult.blockNumber;
    student.blockchainRegistrationStatus = 'success';
    await student.save();
    
    console.log(`Successfully registered student ${student.applicationId} on blockchain`);
    
    return {
      success: true,
      newlyRegistered: true,
      applicationId: student.applicationId,
      txHash: blockchainResult.transactionHash
    };
  } catch (error) {
    console.error(`Error registering student ${student.applicationId}:`, error);
    
    // Update failed attempts count for retry mechanism
    student.blockchainRegistrationAttempts = (student.blockchainRegistrationAttempts || 0) + 1;
    student.blockchainRegistrationStatus = 'failed';
    student.lastBlockchainRegistrationAttempt = new Date();
    await student.save();
    
    return {
      success: false,
      error: error.message,
      applicationId: student.applicationId
    };
  }
}

async function runEnhancedJob() {
  try {
    // Connect to database
    await mongoose.connect(config.database.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');
    
    // Check blockchain connection
    const connected = await blockchainService.isConnected();
    console.log('Blockchain connection status:', connected ? 'CONNECTED' : 'DISCONNECTED');
    
    if (!connected) {
      console.error('Cannot proceed - blockchain is not connected');
      return;
    }
    
    // Confirm contract exists
    if (!blockchainService.contract) {
      console.error('Cannot proceed - blockchain contract is not initialized');
      return;
    }
    
    // Find all student users who don't have a blockchain transaction hash
    const unregisteredStudents = await User.find({
      role: 'student',
      $or: [
        { blockchainTxHash: { $exists: false } },
        { blockchainTxHash: null }
      ]
    });
    
    console.log(`Found ${unregisteredStudents.length} unregistered students`);
    
    // If no unregistered students, check for students with failed attempts
    if (unregisteredStudents.length === 0) {
      console.log('No unregistered students found. Checking for failed registration attempts...');
      
      const failedStudents = await User.find({
        role: 'student',
        blockchainRegistrationStatus: 'failed'
      });
      
      console.log(`Found ${failedStudents.length} students with failed registration attempts`);
      
      if (failedStudents.length > 0) {
        console.log('Would you like to retry failed registrations? (Feature not implemented)');
      }
    }
    
    // Process each unregistered student
    const results = {
      success: 0,
      failure: 0,
      details: []
    };
    
    for (const student of unregisteredStudents) {
      try {
        const result = await registerStudent(student);
        
        results.details.push(result);
        
        if (result.success) {
          results.success++;
        } else {
          results.failure++;
        }
      } catch (error) {
        console.error(`Unexpected error processing student ${student.applicationId}:`, error);
        results.failure++;
        results.details.push({
          success: false,
          error: error.message,
          applicationId: student.applicationId
        });
      }
    }
    
    console.log('\nJob completed with the following results:');
    console.log(`Success: ${results.success}, Failure: ${results.failure}`);
    
    // List students that failed registration
    if (results.failure > 0) {
      console.log('\nFailed registrations:');
      results.details
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`- ${r.applicationId}: ${r.error}`);
        });
    }
    
    return results;
  } catch (error) {
    console.error('Error in enhanced registration job:', error);
    throw error;
  } finally {
    // Disconnect from database
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the job
runEnhancedJob()
  .then(results => {
    console.log('Job execution complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error in job execution:', error);
    process.exit(1);
  });