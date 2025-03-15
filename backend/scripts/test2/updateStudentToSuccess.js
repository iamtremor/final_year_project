// Save this as backend/scripts/updateStudentToSuccess.js

const mongoose = require('mongoose');
const config = require('../../config');
const User = require('../../models/User');

async function updateOneStudentToSuccess() {
  try {
    // Connect to database
    await mongoose.connect(config.database.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to database');
    
    // Find a student to update
    const student = await User.findOne({ 
      role: 'student',
      blockchainRegistrationStatus: { $ne: 'success' }
    });
    
    if (!student) {
      console.log('No eligible students found to update');
      return;
    }
    
    console.log(`Updating student: ${student.fullName} (${student.email})`);
    
    // Update student to success status
    student.blockchainRegistrationStatus = 'success';
    student.blockchainTxHash = 'manual_set_for_testing';
    student.lastBlockchainRegistrationAttempt = new Date();
    
    // Save the changes
    await student.save();
    
    console.log(`Updated student to success status!`);
    
    // Check current stats
    const stats = await getStats();
    console.log('Current stats after update:', stats);
    
  } catch (error) {
    console.error('Error updating student:', error);
  } finally {
    // Disconnect from database
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

async function getStats() {
  // Get all students from database
  const students = await User.find({ role: 'student' });
  
  // Calculate stats
  const stats = {
    total: students.length,
    registered: students.filter(s => s.blockchainRegistrationStatus === 'success').length,
    pending: students.filter(s => s.blockchainRegistrationStatus === 'pending').length,
    failed: students.filter(s => s.blockchainRegistrationStatus === 'failed').length
  };
  
  return stats;
}

// Run the update function
updateOneStudentToSuccess().catch(console.error);

// To run this script:
// node backend/scripts/updateStudentToSuccess.js