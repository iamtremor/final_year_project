// Save as backend/scripts/addSubmittedField.js

const mongoose = require('mongoose');
const config = require('../config');
const NewClearanceForm = require('../models/NewClearanceForm');

async function addSubmittedField() {
  try {
    // Connect to database
    await mongoose.connect(config.database.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to database');
    
    // Find the form
    const form = await NewClearanceForm.findOne({});
    
    if (!form) {
      console.log('No form found');
      return;
    }
    
    // Update the form to add the submitted field
    form.submitted = true;
    await form.save();
    
    console.log('Form updated with submitted: true');
    
    // Check the updated form
    const updatedForm = await NewClearanceForm.findById(form._id);
    console.log('Updated form:', {
      id: updatedForm._id,
      studentName: updatedForm.studentName,
      submitted: updatedForm.submitted
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

addSubmittedField().catch(console.error);