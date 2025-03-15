// Save as fixPasswords.js
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const config = require('../config');

async function fixPasswords() {
  try {
    // Connect to database
    await mongoose.connect(config.database.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to database');
    
    // Find all staff users
    const staffUsers = await User.find({ role: 'staff' });
    console.log(`Found ${staffUsers.length} staff users to fix`);
    
    let updated = 0;
    
    // Reset all passwords to 'password123'
    for (const user of staffUsers) {
      // Generate a new hash for 'password123'
      const salt = await bcrypt.genSalt(10);
      
      // Directly update the password field to avoid triggering the pre-save hook
      await User.updateOne(
        { _id: user._id },
        { 
          $set: { 
            password: await bcrypt.hash('password123', salt) 
          } 
        }
      );
      
      updated++;
      console.log(`Reset password for ${user.fullName} (${user.staffId})`);
    }
    
    console.log(`Successfully reset passwords for ${updated} staff accounts`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

fixPasswords();