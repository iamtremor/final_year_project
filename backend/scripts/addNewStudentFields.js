// Save as backend/scripts/addNewStudentFields.js

const mongoose = require('mongoose');
const User = require('../models/User');
const config = require('../config');

async function addNewFieldsToStudents() {
  try {
    // Connect to database
    await mongoose.connect(config.database.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to database');
    
    // Find all students
    const students = await User.find({ role: 'student' });
    console.log(`Found ${students.length} students`);
    
    // Update each student with default values for new fields
    let updatedCount = 0;
    
    for (const student of students) {
      let updated = false;
      
      // Set default values if they don't exist
      if (student.phoneNumber === undefined) {
        student.phoneNumber = 'Not provided';
        updated = true;
      }
      
      if (student.department === undefined) {
        student.department = 'Not assigned';
        updated = true;
      }
      
      if (student.dateOfBirth === undefined) {
        // Default to January 1, 2000
        student.dateOfBirth = new Date(2000, 0, 1);
        updated = true;
      }
      
      // Save if changes were made
      if (updated) {
        await student.save();
        updatedCount++;
        console.log(`Updated student: ${student.fullName} (${student.applicationId})`);
      }
    }
    
    console.log(`\nAdded new fields to ${updatedCount} students`);
    
    // Show some sample students after update
    if (students.length > 0) {
      const sample = await User.findOne({ role: 'student' }).select('-password');
      console.log('\nSample student after update:');
      console.log(JSON.stringify(sample, null, 2));
    }
    
  } catch (error) {
    console.error('Error updating students:', error);
  } finally {
    // Disconnect from database
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

// Run the function
addNewFieldsToStudents().catch(console.error);