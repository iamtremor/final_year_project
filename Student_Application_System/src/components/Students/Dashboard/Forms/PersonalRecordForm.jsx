import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FiFileText, 
  FiCheckCircle, 
  FiAlertTriangle, 
  FiClock, 
  FiSave, 
  FiLock 
} from "react-icons/fi";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../../../../context/AuthContext";

const PersonalRecord = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    matricNo: "",
    schoolFaculty: "",
    department: user?.department || "",
    course: "",
    gender: "",
    dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : "",
    maritalStatus: "Single",
    religion: "",
    church: "",
    bloodGroup: "",
    homeTown: "",
    stateOfOrigin: "",
    nationality: "Nigerian",
    homeAddress: "",
    nextOfKin: ""
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
          submitted: response.data.personalRecord?.submitted || false,
          approved: response.data.personalRecord?.approved || false,
          locked: !response.data.newClearance.approved, // Form is locked if new clearance form is not approved
          submittedDate: response.data.personalRecord?.submittedDate
        });
        
        // If form has already been submitted, populate with saved data
        if (response.data.personalRecord?.data) {
          setFormData(response.data.personalRecord.data);
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
    
    // Validate required fields
    const requiredFields = [
      'fullName', 'department', 'gender', 'dateOfBirth', 
      'maritalStatus', 'stateOfOrigin', 'nationality', 
      'homeAddress', 'nextOfKin'
    ];
    
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post('/api/clearance/forms/personal-record', formData, {
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
        <h2 className="text-xl font-bold text-[#1E3A8A]">Student Personal Record</h2>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          Please provide your personal information for the university records.
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
                    ? "Your personal record has been approved." 
                    : "Your personal record has been submitted and is awaiting approval."}
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
          {/* Personal Information Section */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
          </div>
          
          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="fullName"
                id="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-[#1E3A8A] focus:border-[#1E3A8A] block w-full sm:text-sm border-gray-300 rounded-md"
                required
                disabled={formStatus.submitted}
              />
            </div>
          </div>
          
          {/* Matric Number */}
          <div>
            <label htmlFor="matricNo" className="block text-sm font-medium text-gray-700">
              Matriculation Number
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="matricNo"
                id="matricNo"
                value={formData.matricNo}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-[#1E3A8A] focus:border-[#1E3A8A] block w-full sm:text-sm border-gray-300 rounded-md"
                disabled={formStatus.submitted}
              />
            </div>
          </div>
          
          {/* School/Faculty */}
          <div>
            <label htmlFor="schoolFaculty" className="block text-sm font-medium text-gray-700">
              School/Faculty
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="schoolFaculty"
                id="schoolFaculty"
                value={formData.schoolFaculty}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-[#1E3A8A] focus:border-[#1E3A8A] block w-full sm:text-sm border-gray-300 rounded-md"
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
          
          {/* Gender */}
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
              Gender <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <select
                name="gender"
                id="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-[#1E3A8A] focus:border-[#1E3A8A] block w-full sm:text-sm border-gray-300 rounded-md"
                required
                disabled={formStatus.submitted}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>
          
          {/* Date of Birth */}
          <div>
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <input
                type="date"
                name="dateOfBirth"
                id="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-[#1E3A8A] focus:border-[#1E3A8A] block w-full sm:text-sm border-gray-300 rounded-md"
                required
                disabled={formStatus.submitted}
              />
            </div>
          </div>
          
          {/* Marital Status */}
          <div>
            <label htmlFor="maritalStatus" className="block text-sm font-medium text-gray-700">
              Marital Status <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <select
                name="maritalStatus"
                id="maritalStatus"
                value={formData.maritalStatus}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-[#1E3A8A] focus:border-[#1E3A8A] block w-full sm:text-sm border-gray-300 rounded-md"
                required
                disabled={formStatus.submitted}
              >
                <option value="Single">Single</option>
                <option value="Married">Married</option>
              </select>
            </div>
          </div>
          
          {/* Religion */}
          <div>
            <label htmlFor="religion" className="block text-sm font-medium text-gray-700">
              Religion
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="religion"
                id="religion"
                value={formData.religion}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-[#1E3A8A] focus:border-[#1E3A8A] block w-full sm:text-sm border-gray-300 rounded-md"
                disabled={formStatus.submitted}
              />
            </div>
          </div>
          
          {/* Church */}
          <div>
            <label htmlFor="church" className="block text-sm font-medium text-gray-700">
              Church/Denomination
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="church"
                id="church"
                value={formData.church}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-[#1E3A8A] focus:border-[#1E3A8A] block w-full sm:text-sm border-gray-300 rounded-md"
                disabled={formStatus.submitted}
              />
            </div>
          </div>
          
          {/* Blood Group */}
          <div>
            <label htmlFor="bloodGroup" className="block text-sm font-medium text-gray-700">
              Blood Group
            </label>
            <div className="mt-1">
              <select
                name="bloodGroup"
                id="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-[#1E3A8A] focus:border-[#1E3A8A] block w-full sm:text-sm border-gray-300 rounded-md"
                disabled={formStatus.submitted}
              >
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>
          
          {/* Location Information Section */}
          <div className="md:col-span-2 mt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Location Information</h3>
          </div>
          
          {/* Home Town */}
          <div>
            <label htmlFor="homeTown" className="block text-sm font-medium text-gray-700">
              Home Town
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="homeTown"
                id="homeTown"
                value={formData.homeTown}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-[#1E3A8A] focus:border-[#1E3A8A] block w-full sm:text-sm border-gray-300 rounded-md"
                disabled={formStatus.submitted}
              />
            </div>
          </div>
          
          {/* State of Origin */}
          <div>
            <label htmlFor="stateOfOrigin" className="block text-sm font-medium text-gray-700">
              State of Origin <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="stateOfOrigin"
                id="stateOfOrigin"
                value={formData.stateOfOrigin}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-[#1E3A8A] focus:border-[#1E3A8A] block w-full sm:text-sm border-gray-300 rounded-md"
                required
                disabled={formStatus.submitted}
              />
            </div>
          </div>
          
          {/* Nationality */}
          <div>
            <label htmlFor="nationality" className="block text-sm font-medium text-gray-700">
              Nationality <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="nationality"
                id="nationality"
                value={formData.nationality}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-[#1E3A8A] focus:border-[#1E3A8A] block w-full sm:text-sm border-gray-300 rounded-md"
                required
                disabled={formStatus.submitted}
              />
            </div>
          </div>
          
          {/* Home Address */}
          <div className="md:col-span-2">
            <label htmlFor="homeAddress" className="block text-sm font-medium text-gray-700">
              Home Address <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <textarea
                name="homeAddress"
                id="homeAddress"
                rows="3"
                value={formData.homeAddress}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-[#1E3A8A] focus:border-[#1E3A8A] block w-full sm:text-sm border-gray-300 rounded-md"
                required
                disabled={formStatus.submitted}
              ></textarea>
            </div>
          </div>
          
          {/* Next of Kin */}
          <div className="md:col-span-2">
            <label htmlFor="nextOfKin" className="block text-sm font-medium text-gray-700">
              Next of Kin (Name and Relationship) <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="nextOfKin"
                id="nextOfKin"
                value={formData.nextOfKin}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-[#1E3A8A] focus:border-[#1E3A8A] block w-full sm:text-sm border-gray-300 rounded-md"
                required
                disabled={formStatus.submitted}
                placeholder="e.g. John Doe (Father)"
              />
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
                  This personal record will be kept as part of your permanent student file.
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

export default PersonalRecord;