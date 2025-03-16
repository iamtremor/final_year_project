const mongoose = require('mongoose');
const User = require('../models/User');
const config = require('../config');

const updateSchoolOfficer = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.database.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');
    
    // Update the school officer with staffId CS001
    const result = await User.updateOne(
      { staffId: "CS001" },
      { 
        $set: { 
          managedDepartments: [
            "Computer Science", 
            "Software Engineering", 
            "Information Technology", 
            "Computer Information Science", 
            "Computer Technology"
          ]
        }
      }
    );
    
    console.log('Update result:', result);
    
    if (result.modifiedCount > 0) {
      console.log('School Officer CS001 successfully updated with managed departments');
    } else {
      console.log('School Officer CS001 was not found or already has the same managed departments');
    }
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error updating school officer:', error);
  }
};

// Run the function
updateSchoolOfficer();