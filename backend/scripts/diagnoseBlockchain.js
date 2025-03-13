// Save as backend/scripts/diagnoseBlockchain.js

const blockchainService = require('../services/blockchainService');
const config = require('../config');
const User = require('../models/User');
const mongoose = require('mongoose');

async function diagnoseBlockchain() {
  console.log('=== Blockchain Diagnosis Tool ===');
  
  // Step 1: Check configuration
  console.log('\n== Configuration Check ==');
  console.log('Provider URL:', config.blockchain.providerUrl);
  console.log('Contract Address:', config.blockchain.contractAddress);
  console.log('Private Key Exists:', !!config.blockchain.privateKey);
  
  // Step 2: Check blockchain connection
  console.log('\n== Blockchain Connection Test ==');
  try {
    const connected = await blockchainService.isConnected();
    console.log('Connection Status:', connected ? 'CONNECTED' : 'DISCONNECTED');
    
    // Get provider details if available
    if (blockchainService.provider) {
      console.log('Provider URL:', blockchainService.provider.connection.url);
      
      try {
        const network = await blockchainService.provider.getNetwork();
        console.log('Network Name:', network.name);
        console.log('Chain ID:', network.chainId);
      } catch (networkErr) {
        console.error('Network Error:', networkErr.message);
      }
    } else {
      console.error('Provider not initialized!');
    }
  } catch (connErr) {
    console.error('Connection Error:', connErr);
  }
  
  // Step 3: Check contract
  console.log('\n== Contract Check ==');
  if (blockchainService.contract) {
    console.log('Contract Address:', blockchainService.contract.address);
    try {
      const admin = await blockchainService.contract.admin();
      console.log('Contract Admin:', admin);
      console.log('Admin Call Successful: YES');
    } catch (adminErr) {
      console.error('Admin Call Error:', adminErr.message);
    }
    
    try {
      const diagnosis = await blockchainService.diagnoseContract();
      console.log('Available Functions:', diagnosis.functions.length);
    } catch (diagErr) {
      console.error('Diagnosis Error:', diagErr.message);
    }
  } else {
    console.error('Contract not initialized!');
  }
  
  // Step 4: Connect to database and check a user
  console.log('\n== Database User Check ==');
  try {
    await mongoose.connect(config.database.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');
    
    // Find a student with blockchain registration status success
    const student = await User.findOne({ 
      role: 'student',
      blockchainRegistrationStatus: 'success'
    });
    
    if (student) {
      console.log('Found student with successful registration status:');
      console.log('  ID:', student._id);
      console.log('  Name:', student.fullName);
      console.log('  Application ID:', student.applicationId);
      console.log('  Blockchain TX Hash:', student.blockchainTxHash);
      
      // Try to get the student's status from blockchain
      try {
        console.log('\n== Blockchain Student Verification ==');
        const blockchainStatus = await blockchainService.getStudentStatus(student.applicationId);
        console.log('Blockchain status for student:', student.applicationId);
        console.log('  Exists on blockchain:', blockchainStatus.exists);
        console.log('  Verified on blockchain:', blockchainStatus.verified);
        console.log('  Registration Time:', blockchainStatus.registrationTime);
        
        if (!blockchainStatus.exists) {
          console.log('\nISSUE DETECTED: Student shows as registered in database but NOT found on the blockchain!');
          console.log('This indicates a mismatch between your database and the blockchain state.');
        }
      } catch (studentErr) {
        console.error('Error getting blockchain status:', studentErr.message);
      }
    } else {
      console.log('No students found with successful registration status');
    }
  } catch (dbErr) {
    console.error('Database connection error:', dbErr.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
  
  console.log('\n=== Diagnosis Complete ===');
}

// Run diagnosis
diagnoseBlockchain()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });