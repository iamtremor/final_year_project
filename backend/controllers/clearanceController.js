// backend/controllers/clearanceController.js
const NewClearanceForm = require('../models/NewClearanceForm');
const ProvAdmissionForm = require('../models/ProvAdmissionForm');
// Import other models

// Get status of all forms for a student
const getFormsStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find all forms for this student
    const newClearanceForm = await NewClearanceForm.findOne({ studentId: userId });
    const provAdmissionForm = await ProvAdmissionForm.findOne({ studentId: userId });
    // Find other forms
    
    // Create response with form status information
    const formStatus = {
      newClearance: {
        submitted: newClearanceForm ? newClearanceForm.submitted : false,
        approved: newClearanceForm ? 
          (newClearanceForm.schoolOfficerApproved && newClearanceForm.deputyRegistrarApproved) : false,
        data: newClearanceForm
      },
      // Other form statuses
    };
    
    res.json(formStatus);
  } catch (error) {
    console.error('Error fetching forms status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Submit new clearance form
const submitNewClearanceForm = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Check if form already exists
    let form = await NewClearanceForm.findOne({ studentId: userId });
    
    if (form && form.submitted) {
      return res.status(400).json({ message: 'Form has already been submitted' });
    }
    
    if (form) {
      // Update existing form
      form.studentName = req.body.studentName;
      form.jambRegNo = req.body.jambRegNo;
      // Update other fields
      form.submitted = true;
    } else {
      // Create new form
      form = new NewClearanceForm({
        studentId: userId,
        studentName: req.body.studentName,
        jambRegNo: req.body.jambRegNo,
        // Other form fields
        submitted: true
      });
    }
    
    await form.save();
    
    res.status(201).json({
      message: 'Form submitted successfully',
      formId: form._id
    });
  
    try {
        const blockchainResult = await blockchainService.recordClearanceForm(
          applicationId,
          'newClearance',
          req.body
        );
        
        // Update form with blockchain transaction info
        form.blockchainTxHash = blockchainResult.transactionHash;
        form.blockchainBlockNumber = blockchainResult.blockNumber;
        await form.save();
        
        console.log(`New clearance form recorded on blockchain: ${blockchainResult.transactionHash}`);
      } catch (blockchainError) {
        console.error('Blockchain recording error:', blockchainError);
        // Continue with response, don't fail if blockchain has issues
      }
      
      res.status(201).json({
        message: 'Form submitted successfully',
        formId: form._id
      });
    } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Similar controllers for other forms

// Staff form approval controller
const approveForm = async (req, res) => {
  try {
    const { formId } = req.params;
    const { formType, approvalType } = req.body;
    
    // Determine which model to use based on formType
    let Model;
    if (formType === 'newClearance') Model = NewClearanceForm;
    else if (formType === 'provAdmission') Model = ProvAdmissionForm;
    // Other form types
    
    if (!Model) {
      return res.status(400).json({ message: 'Invalid form type' });
    }
    
    // Find the form
    const form = await Model.findById(formId);
    
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }
    
    // Update approval status based on staff role
    if (approvalType === 'schoolOfficer') {
      form.schoolOfficerApproved = true;
    } else if (approvalType === 'deputyRegistrar') {
      form.deputyRegistrarApproved = true;
    }
    // Other approval types
    
    if (form.schoolOfficerApproved && form.deputyRegistrarApproved) {
      form.approvedDate = Date.now();
    }
    
    await form.save();
    
    res.json({
      message: 'Form approved successfully',
      formId: form._id,
      approvalType
    });
    try {
        const student = await User.findById(form.studentId);
        
        if (student && student.applicationId) {
          const blockchainResult = await blockchainService.recordFormApproval(
            student.applicationId,
            formType,
            approvalType
          );
          
          console.log(`Form approval recorded on blockchain: ${blockchainResult.transactionHash}`);
        }
      } catch (blockchainError) {
        console.error('Blockchain recording error:', blockchainError);
        // Continue with response, don't fail if blockchain has issues
      }
      
      // Check if all forms are approved for this student
      if (formType === 'affidavit' && approvalType === 'final') {
        // This was the last form and final approval
        try {
          // Check if all required documents are uploaded and approved
          const allDocumentsApproved = await Document.find({ 
            owner: form.studentId,
            status: 'approved'
          });
          
          // Get list of required document types
          const requiredTypes = [
            'Admission Letter', 'JAMB Result', 'JAMB Admission', 
            'WAEC', 'Birth Certificate', 'Payment Receipt', 
            'Medical Report', 'Passport'
          ];
          
          // Check if all required documents are present
          const hasAllDocuments = requiredTypes.every(type => 
            allDocumentsApproved.some(doc => doc.documentType === type)
          );
          
          if (hasAllDocuments) {
            // Complete the entire clearance process on blockchain
            const completionResult = await blockchainService.completeClearanceProcess(
              student.applicationId
            );
            
            console.log(`Clearance process completed on blockchain: ${completionResult.transactionHash}`);
          }
        } catch (completionError) {
          console.error('Error completing clearance process:', completionError);
        }
      }
      
      res.json({
        message: 'Form approved successfully',
        formId: form._id,
        approvalType
      });
    } catch (error) {
    console.error('Error approving form:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getFormsStatus,
  submitNewClearanceForm,
  submitProvAdmissionForm,
  submitPersonalRecordForm,
  submitPersonalRecord2Form,
  submitAffidavitForm,
  approveForm
};