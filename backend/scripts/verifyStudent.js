// Save as backend/scripts/verifyStudent.js

const blockchainService = require('../services/blockchainService');

// ID of the student to verify
const applicationId = '140456';

async function verifyStudent() {
  try {
    console.log(`Attempting to verify student ${applicationId} on blockchain...`);
    
    // First check if the student exists and is already verified
    const currentStatus = await blockchainService.getStudentStatus(applicationId);
    console.log('Current blockchain status:', currentStatus);
    
    if (!currentStatus.exists) {
      console.error(`Student ${applicationId} does not exist on blockchain`);
      return;
    }
    
    if (currentStatus.verified) {
      console.log(`Student ${applicationId} is already verified`);
      return;
    }
    
    // Call verify function
    console.log(`Verifying student ${applicationId}...`);
    const result = await blockchainService.verifyStudent(applicationId);
    
    console.log('Verification successful:', result);
    
    // Check status again
    const newStatus = await blockchainService.getStudentStatus(applicationId);
    console.log('New status after verification:', newStatus);
    
  } catch (error) {
    console.error('Error verifying student:', error);
  }
}

// Run the function
verifyStudent()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });