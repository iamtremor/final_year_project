// backend/jobs/blockchainRegistrationJob.js

const User = require('../models/User');
const blockchainService = require('../services/blockchainService');

/**
 * Background job to register unregistered students on the blockchain
 * This should be scheduled to run periodically (e.g., once every hour)
 */
async function registerUnregisteredStudents() {
  console.log('Starting background job: registerUnregisteredStudents');
  
  try {
    // Find all student users who don't have a blockchain transaction hash
    // This indicates they haven't been registered on the blockchain yet
    const unregisteredStudents = await User.find({
      role: 'student',
      $or: [
        { blockchainTxHash: { $exists: false } },
        { blockchainTxHash: null }
      ]
    });
    
    console.log(`Found ${unregisteredStudents.length} unregistered students`);
    
    // Process each unregistered student
    let successCount = 0;
    let failureCount = 0;
    
    for (const student of unregisteredStudents) {
      try {
        // Check if student already exists on blockchain despite not having txHash in our DB
        const studentStatus = await blockchainService.getStudentStatus(student.applicationId);
        
        if (studentStatus.exists) {
          console.log(`Student ${student.applicationId} already exists on blockchain, updating database record`);
          
          // Update our database to reflect this
          student.blockchainTxHash = 'manual_update_existing_on_chain';
          await student.save();
          successCount++;
          continue;
        }
        
        // Create student data object for blockchain
        const studentData = {
          fullName: student.fullName,
          email: student.email,
          applicationId: student.applicationId,
          registrationTimestamp: new Date().toISOString()
        };
        
        console.log(`Registering student ${student.applicationId} on blockchain...`);
        const blockchainResult = await blockchainService.registerStudent(student.applicationId, studentData);
        
        // Log action on blockchain
        await blockchainService.logAction(
          student.applicationId,
          "ACCOUNT_CREATED_BATCH",
          `Student account created in batch job: ${student.fullName} (${student.email})`
        );
        
        // Update student record with blockchain info
        student.blockchainTxHash = blockchainResult.transactionHash;
        student.blockchainBlockNumber = blockchainResult.blockNumber;
        await student.save();
        
        console.log(`Successfully registered student ${student.applicationId} on blockchain`);
        successCount++;
      } catch (error) {
        console.error(`Error registering student ${student.applicationId} on blockchain:`, error);
        failureCount++;
        
        // Update failed attempts count for retry mechanism
        student.blockchainRegistrationAttempts = (student.blockchainRegistrationAttempts || 0) + 1;
        await student.save();
      }
    }
    
    console.log(`Background job completed: ${successCount} success, ${failureCount} failures`);
    return { success: successCount, failure: failureCount };
  } catch (error) {
    console.error('Error in registerUnregisteredStudents job:', error);
    throw error;
  }
}

module.exports = {
  registerUnregisteredStudents
};