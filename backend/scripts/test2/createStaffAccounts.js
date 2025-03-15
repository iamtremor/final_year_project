// backend/scripts/createStaffAccounts.js
// Script to create test staff accounts for different departments

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const config = require('../../config');

// Staff accounts to create
const staffAccounts = [
  {
    fullName: 'Deputy Registrar',
    email: 'deputy.registrar@university.edu',
    staffId: 'REG001',
    password: 'password123',
    department: 'Registrar',
    phoneNumber: '+234 800 123 4567',
    dateOfBirth: new Date(1980, 0, 1), // January 1, 1980
  },
  {
    fullName: 'School Officer (Computer Science)',
    email: 'school.officer@university.edu',
    staffId: 'CS001',
    password: 'password123',
    department: 'Computer Science',
    phoneNumber: '+234 800 123 4568',
    dateOfBirth: new Date(1985, 5, 15), // June 15, 1985
  },
  {
    fullName: 'Student Support Officer',
    email: 'support@university.edu',
    staffId: 'SSO001',
    password: 'password123',
    department: 'Student Support',
    phoneNumber: '+234 800 123 4569',
    dateOfBirth: new Date(1982, 3, 10), // April 10, 1982
  },
  {
    fullName: 'Finance Officer',
    email: 'finance@university.edu',
    staffId: 'FIN001',
    password: 'password123',
    department: 'Finance',
    phoneNumber: '+234 800 123 4570',
    dateOfBirth: new Date(1975, 7, 20), // August 20, 1975
  },
  {
    fullName: 'Health Services Officer',
    email: 'health@university.edu',
    staffId: 'HSO001',
    password: 'password123',
    department: 'Health Services',
    phoneNumber: '+234 800 123 4571',
    dateOfBirth: new Date(1978, 9, 5), // October 5, 1978
  },
  {
    fullName: 'Department Head (CS)',
    email: 'cs.hod@university.edu',
    staffId: 'HOD001',
    password: 'password123',
    department: 'Computer Science HOD',
    phoneNumber: '+234 800 123 4572',
    dateOfBirth: new Date(1970, 2, 25), // March 25, 1970
  }
];

// Function to create users
async function createStaffAccounts() {
  try {
    // Connect to database
    await mongoose.connect(config.database.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');
    
    let createdCount = 0;
    let skippedCount = 0;
    
    // Process each staff account
    for (const staff of staffAccounts) {
      try {
        // Check if staff already exists
        const existingStaff = await User.findOne({ 
          $or: [
            { staffId: staff.staffId },
            { email: staff.email }
          ]
        });
        
        if (existingStaff) {
          console.log(`Skipping ${staff.fullName} (${staff.staffId}) - already exists`);
          skippedCount++;
          continue;
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(staff.password, salt);
        
        // Create new staff record
        const newStaff = new User({
          fullName: staff.fullName,
          email: staff.email,
          staffId: staff.staffId,
          password: hashedPassword,
          role: 'staff',
          department: staff.department,
          phoneNumber: staff.phoneNumber,
          dateOfBirth: staff.dateOfBirth,
          blockchainRegistrationStatus: 'pending',
          blockchainRegistrationAttempts: 0,
          createdAt: new Date()
        });
        
        await newStaff.save();
        console.log(`Created staff account: ${staff.fullName} (${staff.staffId}) - ${staff.department}`);
        createdCount++;
      } catch (err) {
        console.error(`Error creating staff ${staff.staffId}:`, err);
      }
    }
    
    console.log(`\nAccount creation complete:`);
    console.log(`- Created: ${createdCount}`);
    console.log(`- Skipped: ${skippedCount}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
createStaffAccounts();