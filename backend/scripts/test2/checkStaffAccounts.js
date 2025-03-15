// Create a simple script to check if staff accounts exist
const mongoose = require('mongoose');
const User = require('../../models/User');
const config = require('../../config');

async function checkStaffAccounts() {
  try {
    // Connect to database
    await mongoose.connect(config.database.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to database');
    
    // Find all staff accounts
    const staffAccounts = await User.find({ role: 'staff' });
    
    console.log(`Found ${staffAccounts.length} staff accounts:`);
    staffAccounts.forEach(account => {
      console.log(`- ${account.fullName} (${account.staffId}), Email: ${account.email}`);
    });
    
    // Get one example account with password field (don't log the actual hash)
    if (staffAccounts.length > 0) {
      const example = await User.findOne({ role: 'staff' });
      console.log('Example account has password field:', !!example.password);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

checkStaffAccounts();