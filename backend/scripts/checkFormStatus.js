// Save this as backend/scripts/checkFormStatus.js

const mongoose = require('mongoose');
const config = require('../config');
const NewClearanceForm = require('../models/NewClearanceForm');

async function checkFormStatus() {
  try {
    // Connect to database
    await mongoose.connect(config.database.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to database');
    
    // Get all forms
    const forms = await NewClearanceForm.find({});
    
    console.log(`Found ${forms.length} forms:`);
    
    // Log details of each form
    forms.forEach(form => {
      console.log(JSON.stringify({
        id: form._id,
        studentId: form.studentId,
        studentName: form.studentName,
        submitted: form.submitted,
        deputyRegistrarApproved: form.deputyRegistrarApproved,
        schoolOfficerApproved: form.schoolOfficerApproved,
        submittedDate: form.submittedDate
      }, null, 2));
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

checkFormStatus().catch(console.error);