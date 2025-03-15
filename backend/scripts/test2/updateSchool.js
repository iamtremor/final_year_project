const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const config = require('../../config');

async function updateStaffRecords() {
  try {
    // Connect to database
    await mongoose.connect(config.database.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to database');

    const staffUsers = await User.find({ role: 'staff' });
    console.log(`Found ${staffUsers.length} staff users`);

    for (let user of staffUsers) {
      if (user.staffId === 'CS001') {
        user.department = 'School Officer';
        await user.save();
        console.log(`Updated user ${user.staffId}`);
      }
    }
    
  } catch (error) {
    console.error('Error updating staff records:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

updateStaffRecords().catch(console.error);