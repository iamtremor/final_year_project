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
          student.blockchainRegistrationStatus = 'success';
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
        student.blockchainRegistrationStatus = 'success';
        await student.save();
        
        console.log(`Successfully registered student ${student.applicationId} on blockchain`);
        successCount++;
      } catch (error) {
        console.error(`Error registering student ${student.applicationId} on blockchain:`, error);
        failureCount++;
        
        // Update failed attempts count for retry mechanism
        student.blockchainRegistrationAttempts = (student.blockchainRegistrationAttempts || 0) + 1;
        student.blockchainRegistrationStatus = 'failed';
        student.lastBlockchainRegistrationAttempt = new Date();
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

/**
 * Background job to register unregistered staff on the blockchain
 */
async function registerUnregisteredStaff() {
  console.log('Starting background job: registerUnregisteredStaff');
  
  try {
    // Find all staff users who don't have a blockchain transaction hash
    const unregisteredStaff = await User.find({
      role: 'staff',
      $or: [
        { blockchainTxHash: { $exists: false } },
        { blockchainTxHash: null }
      ]
    });
    
    console.log(`Found ${unregisteredStaff.length} unregistered staff members`);
    
    // Process each unregistered staff
    let successCount = 0;
    let failureCount = 0;
    
    for (const staff of unregisteredStaff) {
      try {
        // Check if staff already exists on blockchain
        const staffStatus = await blockchainService.getUserStatus(staff.staffId, 'staff');
        
        if (staffStatus.exists) {
          console.log(`Staff ${staff.staffId} already exists on blockchain, updating database record`);
          
          // Update our database to reflect this
          staff.blockchainTxHash = 'manual_update_existing_on_chain';
          staff.blockchainRegistrationStatus = 'success';
          await staff.save();
          successCount++;
          continue;
        }
        
        // Create staff data object for blockchain
        const staffData = {
          fullName: staff.fullName,
          email: staff.email,
          staffId: staff.staffId,
          role: 'staff',
          registrationTimestamp: new Date().toISOString()
        };
        
        console.log(`Registering staff ${staff.staffId} on blockchain...`);
        const blockchainResult = await blockchainService.registerStaff(staff.staffId, staffData);
        
        // Log action on blockchain
        await blockchainService.logAction(
          `staff:${staff.staffId}`,
          "STAFF_ACCOUNT_CREATED_BATCH",
          `Staff account created in batch job: ${staff.fullName} (${staff.email})`
        );
        
        // Update staff record with blockchain info
        staff.blockchainTxHash = blockchainResult.transactionHash;
        staff.blockchainBlockNumber = blockchainResult.blockNumber;
        staff.blockchainRegistrationStatus = 'success';
        await staff.save();
        
        console.log(`Successfully registered staff ${staff.staffId} on blockchain`);
        successCount++;
      } catch (error) {
        console.error(`Error registering staff ${staff.staffId} on blockchain:`, error);
        failureCount++;
        
        // Update failed attempts count for retry mechanism
        staff.blockchainRegistrationAttempts = (staff.blockchainRegistrationAttempts || 0) + 1;
        staff.blockchainRegistrationStatus = 'failed';
        staff.lastBlockchainRegistrationAttempt = new Date();
        await staff.save();
      }
    }
    
    console.log(`Staff registration job completed: ${successCount} success, ${failureCount} failures`);
    return { success: successCount, failure: failureCount };
  } catch (error) {
    console.error('Error in registerUnregisteredStaff job:', error);
    throw error;
  }
}

/**
 * Background job to register unregistered admins on the blockchain
 */
async function registerUnregisteredAdmins() {
  console.log('Starting background job: registerUnregisteredAdmins');
  
  try {
    // Find all admin users who don't have a blockchain transaction hash
    const unregisteredAdmins = await User.find({
      role: 'admin',
      $or: [
        { blockchainTxHash: { $exists: false } },
        { blockchainTxHash: null }
      ]
    });
    
    console.log(`Found ${unregisteredAdmins.length} unregistered admin users`);
    
    // Process each unregistered admin
    let successCount = 0;
    let failureCount = 0;
    
    for (const admin of unregisteredAdmins) {
      try {
        // Check if admin already exists on blockchain
        const adminStatus = await blockchainService.getUserStatus(admin.adminId, 'admin');
        
        if (adminStatus.exists) {
          console.log(`Admin ${admin.adminId} already exists on blockchain, updating database record`);
          
          // Update our database to reflect this
          admin.blockchainTxHash = 'manual_update_existing_on_chain';
          admin.blockchainRegistrationStatus = 'success';
          await admin.save();
          successCount++;
          continue;
        }
        
        // Create admin data object for blockchain
        const adminData = {
          fullName: admin.fullName,
          email: admin.email,
          adminId: admin.adminId,
          role: 'admin',
          registrationTimestamp: new Date().toISOString()
        };
        
        console.log(`Registering admin ${admin.adminId} on blockchain...`);
        const blockchainResult = await blockchainService.registerAdmin(admin.adminId, adminData);
        
        // Log action on blockchain
        await blockchainService.logAction(
          `admin:${admin.adminId}`,
          "ADMIN_ACCOUNT_CREATED_BATCH",
          `Admin account created in batch job: ${admin.fullName} (${admin.email})`
        );
        
        // Update admin record with blockchain info
        admin.blockchainTxHash = blockchainResult.transactionHash;
        admin.blockchainBlockNumber = blockchainResult.blockNumber;
        admin.blockchainRegistrationStatus = 'success';
        await admin.save();
        
        console.log(`Successfully registered admin ${admin.adminId} on blockchain`);
        successCount++;
      } catch (error) {
        console.error(`Error registering admin ${admin.adminId} on blockchain:`, error);
        failureCount++;
        
        // Update failed attempts count for retry mechanism
        admin.blockchainRegistrationAttempts = (admin.blockchainRegistrationAttempts || 0) + 1;
        admin.blockchainRegistrationStatus = 'failed';
        admin.lastBlockchainRegistrationAttempt = new Date();
        await admin.save();
      }
    }
    
    console.log(`Admin registration job completed: ${successCount} success, ${failureCount} failures`);
    return { success: successCount, failure: failureCount };
  } catch (error) {
    console.error('Error in registerUnregisteredAdmins job:', error);
    throw error;
  }
}

/**
 * Run all registration jobs in sequence
 */
async function registerAllUnregisteredUsers() {
  console.log('Starting combined job: registerAllUnregisteredUsers');
  
  try {
    // Run all three registration jobs
    const studentResults = await registerUnregisteredStudents();
    const staffResults = await registerUnregisteredStaff();
    const adminResults = await registerUnregisteredAdmins();
    
    // Combine results
    const results = {
      students: studentResults,
      staff: staffResults,
      admins: adminResults,
      total: {
        success: studentResults.success + staffResults.success + adminResults.success,
        failure: studentResults.failure + staffResults.failure + adminResults.failure
      }
    };
    
    console.log('Combined registration job completed:', results);
    return results;
  } catch (error) {
    console.error('Error in combined registration job:', error);
    throw error;
  }
}

module.exports = {
  registerUnregisteredStudents,
  registerUnregisteredStaff,
  registerUnregisteredAdmins,
  registerAllUnregisteredUsers
};