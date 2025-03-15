// Save this as backend/scripts/checkPendingForms.js

const mongoose = require('mongoose');
const config = require('../config');
const NewClearanceForm = require('../models/NewClearanceForm');
const User = require('../models/User');

async function checkPendingForms() {
  try {
    // Connect to database
    await mongoose.connect(config.database.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to database');
    
    // Count all forms
    const totalForms = await NewClearanceForm.countDocuments({});
    console.log(`Total forms in database: ${totalForms}`);
    
    // Count and fetch pending forms
    const pendingForms = await NewClearanceForm.find({
      deputyRegistrarApproved: false,
      submitted: true
    });
    
    console.log(`Pending forms for Registrar: ${pendingForms.length}`);
    
    // Log details of each form
    for (const form of pendingForms) {
      const student = await User.findById(form.studentId);
      console.log('Form details:', {
        id: form._id,
        studentId: form.studentId,
        studentName: student ? student.fullName : 'Unknown',
        submitted: form.submitted,
        deputyRegistrarApproved: form.deputyRegistrarApproved,
        schoolOfficerApproved: form.schoolOfficerApproved,
        submittedDate: form.submittedDate
      });
    }
    
    // Check staff users with Registrar department
    const registrarStaff = await User.find({ 
      role: 'staff', 
      department: 'Registrar' 
    });
    
    console.log(`Staff with Registrar department: ${registrarStaff.length}`);
    registrarStaff.forEach(staff => {
      console.log('Registrar staff:', {
        id: staff._id,
        name: staff.fullName,
        email: staff.email,
        staffId: staff.staffId,
        department: staff.department
      });
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

checkPendingForms().catch(console.error);