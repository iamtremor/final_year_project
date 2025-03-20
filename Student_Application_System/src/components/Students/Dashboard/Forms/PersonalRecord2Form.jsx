import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FiFileText, 
  FiCheckCircle, 
  FiAlertTriangle, 
  FiClock, 
  FiSave, 
  FiLock,
  FiPlusCircle,
  FiXCircle
} from "react-icons/fi";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../../../../context/AuthContext";

const PersonalRecord2Form = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    parentGuardianName: "",
    parentGuardianAddress: "",
    parentGuardianOrigin: "",
    parentGuardianCountry: "Nigeria",
    parentGuardianPhone: "",
    parentGuardianEmail: "",
    fatherName: "",
    fatherAddress: "",
    fatherPhone: "",
    fatherOccupation: "",
    motherName: "",
    motherAddress: "",
    motherPhone: "",
    motherOccupation: "",
    educationHistory: [
      {
        schoolName: "",
        schoolAddress: "",
        startDate: "",
        endDate: ""
      }
    ],
    qualifications: ""
  });
  
  const [formStatus, setFormStatus] = useState({
    submitted: false,
    approved: false,
    locked: true,
    submittedDate: null
  });
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFormStatus();
  }, []);

  const fetchFormStatus = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error("Authentication token not found. Please log in again.");
        setLoading(false);
        return;
      }
      
      // Get clearance forms status
      const response = await axios.get('/api/clearance/forms', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data) {
        // Update form status
        setFormStatus({
          submitted: response.data.personalRecord2?.submitted || false,
          approved: response.data.personalRecord2?.approved || false,
          locked: !response.data.newClearance.approved, // Form is locked if new clearance form is not approved
          submittedDate: response.data.personalRecord2?.submittedDate
        });
        
        // If form has already been submitted, populate with saved data
        if (response.data.personalRecord2?.data) {
          setFormData(response.data.personalRecord2.data);
        }
      }
    } catch (error) {
      console.error('Error fetching form status:', error);
      toast.error('Failed to load form data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle education history form input changes
  const handleEducationChange = (index, e) => {
    const { name, value } = e.target;
    const updatedEducation = [...formData.educationHistory];
    updatedEducation[index] = {
      ...updatedEducation[index],
      [name]: value
    };
    
    setFormData(prev => ({
      ...prev,
      educationHistory: updatedEducation
    }));
  };
  
  // Add new education history entry
  const addEducationHistory = () => {
    setFormData(prev => ({
      ...prev,
      educationHistory: [
        ...prev.educationHistory,
        {
          schoolName: "",
          schoolAddress: "",
          startDate: "",
          endDate: ""
        }
      ]
    }));
  };
  
  // Remove education history entry
  const removeEducationHistory = (index) => {
    if (formData.educationHistory.length === 1) {
      toast.error("At least one education history record is required");
      return;
    }
    
    const updatedEducation = [...formData.educationHistory];
    updatedEducation.splice(index, 1);
    
    setFormData(prev => ({
      ...prev,
      educationHistory: updatedEducation
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formStatus.locked) {
      toast.error('This form is currently locked. Complete the New Clearance Form first.');
      return;
    }
    
    if (formStatus.submitted) {
      toast.error('This form has already been submitted');
      return;
    }
    
    // Validate required fields
    const requiredFields = [
      'parentGuardianName', 'parentGuardianAddress', 
      'parentGuardianPhone', 'parentGuardianOrigin'
    ];
    
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    // Validate education history - school name is required
    if (formData.educationHistory.some(edu => !edu.schoolName)) {
      toast.error('Please enter a name for each school in your education history');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post('/api/clearance/forms/personal-record2', formData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      toast.success('Form submitted successfully');
      setFormStatus(prev => ({
        ...prev,
        submitted: true,
        submittedDate: new Date()
      }));
      
      // Navigate to the forms status page after successful submission
      setTimeout(() => {
        navigate('/student/forms/form-status');
      }, 2000);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(error.response?.data?.message || 'Failed to submit form');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1E3A8A]"></div>
      </div>
    );
  }

  if (formStatus.locked) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <FiLock className="text-gray-500 text-xl" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Form Locked</h3>
        <p className="text-gray-600 max-w-md mx-auto mb-6">
          This form is currently locked. You need to complete and get approval for the New Clearance Form first.
        </p>
        <button
          onClick={() => navigate('/student/forms/new-clearance')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#1E3A8A] hover:bg-[#152a63]"
        >
          Go to New Clearance Form
        </button>
      </div>
    );
  }

  return (
    <div>
      <Toaster position="top-right" />
      
      <div className="p-6">
        <div className="flex items-center mb-6">
                <FiFileText className="text-2xl text-[#1E3A8A] mr-2" />
                <h2 className="text-xl font-bold text-[#1E3A8A]">Family Information Record</h2>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          Please provide information about your family background and educational history.
        </p>
      </div>
      
      {/* Form Status Banner */}
      {formStatus.submitted && (
        <div className={`p-4 mb-6 rounded-md ${
          formStatus.approved ? "bg-green-50 border-l-4 border-green-500" :
          "bg-yellow-50 border-l-4 border-yellow-500"
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {formStatus.approved ? (
                <FiCheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <FiClock className="h-5 w-5 text-yellow-500" />
              )}
            </div>
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${
                formStatus.approved ? "text-green-800" : "text-yellow-800"
              }`}>
                {formStatus.approved ? "Form Approved" : "Form Submitted"}
              </h3>
              <div className={`mt-2 text-sm ${
                formStatus.approved ? "text-green-700" : "text-yellow-700"
              }`}>
                <p>
                  {formStatus.approved 
                    ? "Your family information record has been approved." 
                    : "Your family information record has been submitted and is awaiting approval."}
                </p>
                {formStatus.submittedDate && (
                  <p className="mt-1">
                    Submitted on: {new Date(formStatus.submittedDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Guardian Information Section */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Parent/Guardian Information</h3>
          </div>
          
          {/* Parent/Guardian Name */}
          <div>
            <label htmlFor="parentGuardianName" className="block text-sm font-medium text-gray-700">
              Parent/Guardian Name <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="parentGuardianName"
                id="parentGuardianName"
                value={formData.parentGuardianName}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-[#1E3A8A] focus:border-[#1E3A8A] block w-full sm:text-sm border-gray-300 rounded-md"
                required
                disabled={formStatus.submitted}
              />
            </div>
          </div>
          
          {/* Parent/Guardian Origin */}
          <div>
            <label htmlFor="parentGuardianOrigin" className="block text-sm font-medium text-gray-700">
              State of Origin <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="parentGuardianOrigin"
                id="parentGuardianOrigin"
                value={formData.parentGuardianOrigin}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-[#1E3A8A] focus:border-[#1E3A8A] block w-full sm:text-sm border-gray-300 rounded-md"
                required
                disabled={formStatus.submitted}
              />
            </div>
          </div>
          
          {/* Parent/Guardian Country */}
          <div>
            <label htmlFor="parentGuardianCountry" className="block text-sm font-medium text-gray-700">
              Country <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="parentGuardianCountry"
                id="parentGuardianCountry"
                value={formData.parentGuardianCountry}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-[#1E3A8A] focus:border-[#1E3A8A] block w-full sm:text-sm border-gray-300 rounded-md"
                required
                disabled={formStatus.submitted}
              />
            </div>
          </div>
          
          {/* Parent/Guardian Phone */}
          <div>
            <label htmlFor="parentGuardianPhone" className="block text-sm font-medium text-gray-700">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="parentGuardianPhone"
                id="parentGuardianPhone"
                value={formData.parentGuardianPhone}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-[#1E3A8A] focus:border-[#1E3A8A] block w-full sm:text-sm border-gray-300 rounded-md"
                required
                disabled={formStatus.submitted}
              />
            </div>
          </div>
          
          {/* Parent/Guardian Email */}
          <div>
            <label htmlFor="parentGuardianEmail" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <div className="mt-1">
              <input
                type="email"
                name="parentGuardianEmail"
                id="parentGuardianEmail"
                value={formData.parentGuardianEmail}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-[#1E3A8A] focus:border-[#1E3A8A] block w-full sm:text-sm border-gray-300 rounded-md"
                disabled={formStatus.submitted}
              />
            </div>
          </div>
          
          {/* Parent/Guardian Address */}
          <div className="md:col-span-2">
            <label htmlFor="parentGuardianAddress" className="block text-sm font-medium text-gray-700">
              Address <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <textarea
                name="parentGuardianAddress"
                id="parentGuardianAddress"
                rows="3"
                value={formData.parentGuardianAddress}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-[#1E3A8A] focus:border-[#1E3A8A] block w-full sm:text-sm border-gray-300 rounded-md"
                required
                disabled={formStatus.submitted}
              ></textarea>
            </div>
          </div>
          
          {/* Parents Information Section */}
          <div className="md:col-span-2 mt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Parents Information (Optional)</h3>
          </div>
          
          {/* Father Information */}
          <div>
            <label htmlFor="fatherName" className="block text-sm font-medium text-gray-700">
              Father's Name
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="fatherName"
                id="fatherName"
                value={formData.fatherName}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-[#1E3A8A] focus:border-[#1E3A8A] block w-full sm:text-sm border-gray-300 rounded-md"
                disabled={formStatus.submitted}
              />
            </div>
          </div>
          
          {/* Father's Occupation */}
          <div>
            <label htmlFor="fatherOccupation" className="block text-sm font-medium text-gray-700">
              Father's Occupation
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="fatherOccupation"
                id="fatherOccupation"
                value={formData.fatherOccupation}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-[#1E3A8A] focus:border-[#1E3A8A] block w-full sm:text-sm border-gray-300 rounded-md"
                disabled={formStatus.submitted}
              />
            </div>
          </div>
          
          {/* Father's Phone */}
          <div>
            <label htmlFor="fatherPhone" className="block text-sm font-medium text-gray-700">
              Father's Phone
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="fatherPhone"
                id="fatherPhone"
                value={formData.fatherPhone}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-[#1E3A8A] focus:border-[#1E3A8A] block w-full sm:text-sm border-gray-300 rounded-md"
                disabled={formStatus.submitted}
              />
            </div>
          </div>
          
          {/* Father's Address */}
          <div>
            <label htmlFor="fatherAddress" className="block text-sm font-medium text-gray-700">
              Father's Address
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="fatherAddress"
                id="fatherAddress"
                value={formData.fatherAddress}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-[#1E3A8A] focus:border-[#1E3A8A] block w-full sm:text-sm border-gray-300 rounded-md"
                disabled={formStatus.submitted}
              />
            </div>
          </div>
          
          {/* Mother Information */}
          <div>
            <label htmlFor="motherName" className="block text-sm font-medium text-gray-700">
              Mother's Name
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="motherName"
                id="motherName"
                value={formData.motherName}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-[#1E3A8A] focus:border-[#1E3A8A] block w-full sm:text-sm border-gray-300 rounded-md"
                disabled={formStatus.submitted}
              />
            </div>
          </div>
          
          {/* Mother's Occupation */}
          <div>
            <label htmlFor="motherOccupation" className="block text-sm font-medium text-gray-700">
              Mother's Occupation
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="motherOccupation"
                id="motherOccupation"
                value={formData.motherOccupation}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-[#1E3A8A] focus:border-[#1E3A8A] block w-full sm:text-sm border-gray-300 rounded-md"
                disabled={formStatus.submitted}
              />
            </div>
          </div>
          
          {/* Mother's Phone */}
          <div>
            <label htmlFor="motherPhone" className="block text-sm font-medium text-gray-700">
              Mother's Phone
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="motherPhone"
                id="motherPhone"
                value={formData.motherPhone}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-[#1E3A8A] focus:border-[#1E3A8A] block w-full sm:text-sm border-gray-300 rounded-md"
                disabled={formStatus.submitted}
              />
            </div>
          </div>
          
          {/* Mother's Address */}
          <div>
            <label htmlFor="motherAddress" className="block text-sm font-medium text-gray-700">
              Mother's Address
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="motherAddress"
                id="motherAddress"
                value={formData.motherAddress}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-[#1E3A8A] focus:border-[#1E3A8A] block w-full sm:text-sm border-gray-300 rounded-md"
                disabled={formStatus.submitted}
              />
            </div>
          </div>
          
          {/* Educational Background Section */}
          <div className="md:col-span-2 mt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Educational Background</h3>
          </div>
          
          {/* Education History */}
          <div className="md:col-span-2">
            {formData.educationHistory.map((education, index) => (
              <div key={index} className="p-4 border rounded-md mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-gray-900">School #{index + 1}</h4>
                  {!formStatus.submitted && formData.educationHistory.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEducationHistory(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <FiXCircle className="h-5 w-5" />
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* School Name */}
                  <div>
                    <label htmlFor={`schoolName-${index}`} className="block text-sm font-medium text-gray-700">
                      School Name <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="schoolName"
                        id={`schoolName-${index}`}
                        value={education.schoolName}
                        onChange={(e) => handleEducationChange(index, e)}
                        className="shadow-sm focus:ring-[#1E3A8A] focus:border-[#1E3A8A] block w-full sm:text-sm border-gray-300 rounded-md"
                        required
                        disabled={formStatus.submitted}
                      />
                    </div>
                  </div>
                  
                  {/* School Address */}
                  <div>
                    <label htmlFor={`schoolAddress-${index}`} className="block text-sm font-medium text-gray-700">
                      School Address
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="schoolAddress"
                        id={`schoolAddress-${index}`}
                        value={education.schoolAddress}
                        onChange={(e) => handleEducationChange(index, e)}
                        className="shadow-sm focus:ring-[#1E3A8A] focus:border-[#1E3A8A] block w-full sm:text-sm border-gray-300 rounded-md"
                        disabled={formStatus.submitted}
                      />
                    </div>
                  </div>
                  
                  {/* Start Date */}
                  <div>
                    <label htmlFor={`startDate-${index}`} className="block text-sm font-medium text-gray-700">
                      Start Date
                    </label>
                    <div className="mt-1">
                      <input
                        type="date"
                        name="startDate"
                        id={`startDate-${index}`}
                        value={education.startDate}
                        onChange={(e) => handleEducationChange(index, e)}
                        className="shadow-sm focus:ring-[#1E3A8A] focus:border-[#1E3A8A] block w-full sm:text-sm border-gray-300 rounded-md"
                        disabled={formStatus.submitted}
                      />
                    </div>
                  </div>
                  
                  {/* End Date */}
                  <div>
                    <label htmlFor={`endDate-${index}`} className="block text-sm font-medium text-gray-700">
                      End Date
                    </label>
                    <div className="mt-1">
                      <input
                        type="date"
                        name="endDate"
                        id={`endDate-${index}`}
                        value={education.endDate}
                        onChange={(e) => handleEducationChange(index, e)}
                        className="shadow-sm focus:ring-[#1E3A8A] focus:border-[#1E3A8A] block w-full sm:text-sm border-gray-300 rounded-md"
                        disabled={formStatus.submitted}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {!formStatus.submitted && (
              <button
                type="button"
                onClick={addEducationHistory}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FiPlusCircle className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
                Add Another School
              </button>
            )}
          </div>
          
          {/* Qualifications */}
          <div className="md:col-span-2">
            <label htmlFor="qualifications" className="block text-sm font-medium text-gray-700">
              Additional Qualifications
            </label>
            <div className="mt-1">
              <textarea
                name="qualifications"
                id="qualifications"
                rows="3"
                value={formData.qualifications}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-[#1E3A8A] focus:border-[#1E3A8A] block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="List any additional qualifications, certifications, or skills"
                disabled={formStatus.submitted}
              ></textarea>
            </div>
          </div>
        </div>
        
        {/* Form Notice */}
        <div className="rounded-md bg-blue-50 p-4 mt-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertTriangle className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Important Information</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  This family information record will be kept as part of your permanent student file.
                  Please ensure all information is accurate and up to date.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Submit Button */}
        {!formStatus.submitted && (
          <div className="flex justify-end mt-6">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#1E3A8A] hover:bg-[#152a63] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E3A8A]"
              disabled={submitting || formStatus.locked}
            >
              {submitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                <>
                  <FiSave className="-ml-1 mr-2 h-5 w-5" />
                  Submit Form
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default PersonalRecord2Form;