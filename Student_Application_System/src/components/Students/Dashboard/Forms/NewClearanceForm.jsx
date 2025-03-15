// src/components/Students/Dashboard/Forms/NewClearanceForm.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiFileText, FiCheckCircle, FiAlertTriangle, FiClock, FiSave } from "react-icons/fi";
import axios from "axios";
import { useAuth } from "../../../../context/AuthContext";
import toast, { Toaster } from "react-hot-toast";

const NewClearanceForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    studentName: user?.fullName || "",
    jambRegNo: "",
    oLevelQualification: false,
    changeOfCourse: false,
    changeOfInstitution: false,
    uploadOLevel: false,
    jambAdmissionLetter: false
  });
  const [formStatus, setFormStatus] = useState({
    submitted: false,
    deputyRegistrarApproved: false,
    schoolOfficerApproved: false,
    approved: false,
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
      
      const response = await axios.get('/api/clearance/forms', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data && response.data.newClearance) {
        setFormStatus({
          submitted: response.data.newClearance.submitted,
          deputyRegistrarApproved: response.data.newClearance.deputyRegistrarApproved,
          schoolOfficerApproved: response.data.newClearance.schoolOfficerApproved,
          approved: response.data.newClearance.approved,
          submittedDate: response.data.newClearance.submittedDate
        });
        
        // If form has already been submitted, populate with saved data
        if (response.data.newClearance.data) {
          setFormData(response.data.newClearance.data);
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
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formStatus.submitted) {
      toast.error('This form has already been submitted');
      return;
    }
    
    // Validate form data
    if (!formData.studentName || !formData.jambRegNo) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post('/api/clearance/forms/new-clearance', formData, {
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

  return (
    <div className="p-6">
      <Toaster position="top-right" />
      
      <div className="flex items-center mb-6">
        <FiFileText className="text-2xl text-[#1E3A8A] mr-2" />
        <h2 className="text-2xl font-bold text-[#1E3A8A]">New Clearance Form</h2>
      </div>
      
      {/* Form Status */}
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
                    ? "Your form has been fully approved by all required signatories." 
                    : formStatus.deputyRegistrarApproved
                      ? "Your form has been approved by the Deputy Registrar and is awaiting School Officer approval."
                      : "Your form has been submitted and is awaiting Deputy Registrar approval."}
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
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Student Name */}
              <div>
                <label htmlFor="studentName" className="block text-sm font-medium text-gray-700">
                  Student Name <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="studentName"
                    id="studentName"
                    value={formData.studentName}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-[#1E3A8A] focus:border-[#1E3A8A] block w-full sm:text-sm border-gray-300 rounded-md"
                    required
                    disabled={formStatus.submitted}
                  />
                </div>
              </div>
              
              {/* JAMB Registration Number */}
              <div>
                <label htmlFor="jambRegNo" className="block text-sm font-medium text-gray-700">
                  JAMB Registration Number <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="jambRegNo"
                    id="jambRegNo"
                    value={formData.jambRegNo}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-[#1E3A8A] focus:border-[#1E3A8A] block w-full sm:text-sm border-gray-300 rounded-md"
                    required
                    disabled={formStatus.submitted}
                  />
                </div>
              </div>
              
              {/* Checkboxes */}
              <div className="space-y-4">
                <div className="relative flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="oLevelQualification"
                      name="oLevelQualification"
                      type="checkbox"
                      checked={formData.oLevelQualification}
                      onChange={handleInputChange}
                      className="focus:ring-[#1E3A8A] h-4 w-4 text-[#1E3A8A] border-gray-300 rounded"
                      disabled={formStatus.submitted}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="oLevelQualification" className="font-medium text-gray-700">
                      O-Level Qualification
                    </label>
                    <p className="text-gray-500">I have the required O-Level qualification for my course</p>
                  </div>
                </div>
                
                <div className="relative flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="changeOfCourse"
                      name="changeOfCourse"
                      type="checkbox"
                      checked={formData.changeOfCourse}
                      onChange={handleInputChange}
                      className="focus:ring-[#1E3A8A] h-4 w-4 text-[#1E3A8A] border-gray-300 rounded"
                      disabled={formStatus.submitted}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="changeOfCourse" className="font-medium text-gray-700">
                      Change of Course
                    </label>
                    <p className="text-gray-500">I am changing my course</p>
                  </div>
                </div>
                
                <div className="relative flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="changeOfInstitution"
                      name="changeOfInstitution"
                      type="checkbox"
                      checked={formData.changeOfInstitution}
                      onChange={handleInputChange}
                      className="focus:ring-[#1E3A8A] h-4 w-4 text-[#1E3A8A] border-gray-300 rounded"
                      disabled={formStatus.submitted}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="changeOfInstitution" className="font-medium text-gray-700">
                      Change of Institution
                    </label>
                    <p className="text-gray-500">I am transferring from another institution</p>
                  </div>
                </div>
                
                <div className="relative flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="uploadOLevel"
                      name="uploadOLevel"
                      type="checkbox"
                      checked={formData.uploadOLevel}
                      onChange={handleInputChange}
                      className="focus:ring-[#1E3A8A] h-4 w-4 text-[#1E3A8A] border-gray-300 rounded"
                      disabled={formStatus.submitted}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="uploadOLevel" className="font-medium text-gray-700">
                      O-Level Results
                    </label>
                    <p className="text-gray-500">I have uploaded my O-Level results</p>
                  </div>
                </div>
                
                <div className="relative flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="jambAdmissionLetter"
                      name="jambAdmissionLetter"
                      type="checkbox"
                      checked={formData.jambAdmissionLetter}
                      onChange={handleInputChange}
                      className="focus:ring-[#1E3A8A] h-4 w-4 text-[#1E3A8A] border-gray-300 rounded"
                      disabled={formStatus.submitted}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="jambAdmissionLetter" className="font-medium text-gray-700">
                      JAMB Admission Letter
                    </label>
                    <p className="text-gray-500">I have uploaded my JAMB admission letter</p>
                  </div>
                </div>
              </div>
              
              {/* Form Note */}
              <div className="rounded-md bg-blue-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FiAlertTriangle className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Important Information</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        This form must be approved by the Deputy Registrar and School Officer before you can access 
                        the other clearance forms. Please ensure all information is accurate before submitting.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Submit Button */}
              {!formStatus.submitted && (
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#1E3A8A] hover:bg-[#152a63] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E3A8A]"
                    disabled={submitting}
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
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewClearanceForm;