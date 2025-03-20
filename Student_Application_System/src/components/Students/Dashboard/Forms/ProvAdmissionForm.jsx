import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FiFileText, 
  FiCheckCircle, 
  FiAlertTriangle, 
  FiClock, 
  FiSave, 
  FiX, 
  FiLock 
} from "react-icons/fi";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../../../../context/AuthContext";

const ProvAdmissionForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    studentName: user?.fullName || "",
    department: user?.department || "",
    course: "",
    matricNumber: "",
    session: "",
    acceptanceDate: ""
  });
  
  const [formStatus, setFormStatus] = useState({
    submitted: false,
    approved: false,
    locked: true,
    submittedDate: null,
    approvals: []
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
      
      if (response.data && response.data.provAdmission) {
        // Update form status
        setFormStatus({
          submitted: response.data.provAdmission.submitted || false,
          approved: response.data.provAdmission.approved || false,
          locked: !response.data.newClearance.approved, // Form is locked if new clearance form is not approved
          submittedDate: response.data.provAdmission.submittedDate,
          approvals: response.data.provAdmission.approvals || []
        });
        
        // If form has already been submitted, populate with saved data
        if (response.data.provAdmission.data) {
          setFormData(response.data.provAdmission.data);
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
    
    // Validate form data
    if (!formData.studentName || !formData.department || !formData.course) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post('/api/clearance/forms/prov-admission', formData, {
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
  
  // Function to render approval status
  const renderApprovalStatus = () => {
    if (!formStatus.approvals || formStatus.approvals.length === 0) {
      return (
        <div className="mt-4 bg-blue-50 p-4 rounded-md">
          <p className="text-sm text-blue-700">
            This form requires approval from multiple officers. Status will be updated here after submission.
          </p>
        </div>
      );
    }
    
    return (
      <div className="mt-6 bg-gray-50 p-4 rounded-md">
        <h4 className="font-medium text-gray-700 mb-3">Approval Status</h4>
        <div className="space-y-3">
          {formStatus.approvals.map((approval, index) => (
            <div key={index} className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center">
                {approval.approved ? (
                  <FiCheckCircle className="text-green-500 mr-2" />
                ) : (
                  <FiClock className="text-yellow-500 mr-2" />
                )}
                <span className="font-medium text-gray-700">
                  {formatApproverRole(approval.staffRole)}
                </span>
              </div>
              <div>
                {approval.approved ? (
                  <span className="text-sm text-green-600">
                    Approved {approval.approvedDate && `on ${formatDate(approval.approvedDate)}`}
                  </span>
                ) : (
                  <span className="text-sm text-yellow-600">Pending</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Helper to format approver role
  const formatApproverRole = (role) => {
    switch (role) {
      case 'schoolOfficer':
        return 'School Officer';
      case 'deputyRegistrar':
        return 'Deputy Registrar';
      case 'departmentHead':
        return 'Department Head (HOD)';
      case 'studentSupport':
        return 'Student Support Services';
      case 'finance':
        return 'Finance Department';
      case 'library':
        return 'Library';
      case 'health':
        return 'Health Services';
      default:
        return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };
  
  // Helper to format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return dateString;
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
        <h2 className="text-xl font-bold text-[#1E3A8A]">Provisional Admission Form</h2>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          This form confirms your provisional admission to the program and must be approved by multiple departments.
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
                    ? "Your form has been fully approved by all required signatories." 
                    : "Your form has been submitted and is awaiting approval."}
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
          
          {/* Department */}
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700">
              Department <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="department"
                id="department"
                value={formData.department}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-[#1E3A8A] focus:border-[#1E3A8A] block w-full sm:text-sm border-gray-300 rounded-md"
                required
                disabled={formStatus.submitted}
              />
            </div>
          </div>
          
          {/* Course */}
          <div>
            <label htmlFor="course" className="block text-sm font-medium text-gray-700">
              Course <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="course"
                id="course"
                value={formData.course}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-[#1E3A8A] focus:border-[#1E3A8A] block w-full sm:text-sm border-gray-300 rounded-md"
                required
                disabled={formStatus.submitted}
              />
            </div>
          </div>
          
          {/* Matric Number */}
          <div>
            <label htmlFor="matricNumber" className="block text-sm font-medium text-gray-700">
              Matriculation Number
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="matricNumber"
                id="matricNumber"
                value={formData.matricNumber}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-[#1E3A8A] focus:border-[#1E3A8A] block w-full sm:text-sm border-gray-300 rounded-md"
                disabled={formStatus.submitted}
              />
            </div>
          </div>
          
          {/* Session */}
          <div>
            <label htmlFor="session" className="block text-sm font-medium text-gray-700">
              Academic Session
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="session"
                id="session"
                value={formData.session}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-[#1E3A8A] focus:border-[#1E3A8A] block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="e.g. 2024/2025"
                disabled={formStatus.submitted}
              />
            </div>
          </div>
          
          {/* Acceptance Date */}
          <div>
            <label htmlFor="acceptanceDate" className="block text-sm font-medium text-gray-700">
              Acceptance Date
            </label>
            <div className="mt-1">
              <input
                type="date"
                name="acceptanceDate"
                id="acceptanceDate"
                value={formData.acceptanceDate}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-[#1E3A8A] focus:border-[#1E3A8A] block w-full sm:text-sm border-gray-300 rounded-md"
                disabled={formStatus.submitted}
              />
            </div>
          </div>
        </div>
        
        {/* Approval Status Section */}
        {renderApprovalStatus()}
        
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
                  This form needs to be approved by multiple university officers in sequence. You will 
                  receive notifications as each officer approves your form. All approvals must be completed
                  before you can proceed with full registration.
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

const FiInfo = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);

export default ProvAdmissionForm;