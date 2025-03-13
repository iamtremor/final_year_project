// Save as backend/scripts/updateStaffRecords.js

const mongoose = require('mongoose');
const User = require('../models/User');
const config = require('../config');

async function updateStaffRecords() {
  try {
    // Connect to database
    await mongoose.connect(config.database.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to database');
    
    // Find all staff users
    const staffUsers = await User.find({ role: 'staff' });
    console.log(`Found ${staffUsers.length} staff users`);
    
    // Update each staff user with default values for new fields
    let updatedCount = 0;
    
    for (const staff of staffUsers) {
      let updated = false;
      
      // Set default values if they don't exist
      if (staff.phoneNumber === undefined) {
        staff.phoneNumber = 'Not provided';
        updated = true;
      }
      
      if (staff.department === undefined) {
        staff.department = 'Not assigned';
        updated = true;
      }
      
      if (staff.dateOfBirth === undefined) {
        // Default to January 1, 1980 (ensuring staff are adults)
        staff.dateOfBirth = new Date(1980, 0, 1);
        updated = true;
      }
      
      // Save if changes were made
      if (updated) {
        await staff.save();
        updatedCount++;
        console.log(`Updated staff: ${staff.fullName} (${staff.staffId})`);
      }
    }
    
    console.log(`\nAdded new fields to ${updatedCount} staff records`);
    
  } catch (error) {
    console.error('Error updating staff records:', error);
  } finally {
    // Disconnect from database
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

// Run the function
updateStaffRecords().catch(console.error);