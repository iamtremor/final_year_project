import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FiFileText, 
  FiCheckCircle, 
  FiAlertTriangle, 
  FiClock, 
  FiSave, 
  FiLock,
  FiInfo
} from "react-icons/fi";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../../../../context/AuthContext";

const AffidavitForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    studentName: user?.fullName || "",
    faculty: "",
    department: user?.department || "",
    course: "",
    agreementDate: new Date().toISOString().split('T')[0],
    signature: "",
    readAndUnderstood: false,
    agreeToTerms: false
  });
  
  const [formStatus, setFormStatus] = useState({
    submitted: false,
    approved: false,
    locked: true,
    submittedDate: null
  });
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // University rules and regulations - could be fetched from API in a real scenario
  const rulesAndRegulations = [
    "1. Students must maintain a high standard of personal and academic integrity.",
    "2. All students must attend at least 75% of lectures to qualify for examinations.",
    "3. The use of mobile phones is prohibited during lectures and examinations.",
    "4. Students must dress modestly and in accordance with the university dress code.",
    "5. Plagiarism and any form of academic dishonesty will result in disciplinary action.",
    "6. Students must respect university property and facilities.",
    "7. Harassment of any kind will not be tolerated and is grounds for expulsion.",
    "8. Students must adhere to the examination regulations as stipulated by the university.",
    "9. Unauthorized access to restricted areas of the university is prohibited.",
    "10. All students must have a valid ID card on campus at all times.",
    "11. The possession, use, or distribution of illegal substances is strictly prohibited.",
    "12. Students must follow all health and safety regulations while on campus.",
    "13. Participation in cult activities is strictly prohibited and is grounds for expulsion.",
    "14. Students must settle all financial obligations to the university promptly."
  ];

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
          submitted: response.data.affidavit?.submitted || false,
          approved: response.data.affidavit?.approved || false,
          locked: !response.data.newClearance.approved, // Form is locked if new clearance form is not approved
          submittedDate: response.data.affidavit?.submittedDate
        });
        
        // If form has already been submitted, populate with saved data
        if (response.data.affidavit?.data) {
          setFormData(response.data.affidavit.data);
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
    
    if (formStatus.locked) {
      toast.error('This form is currently locked. Complete the New Clearance Form first.');
      return;
    }
    
    if (formStatus.submitted) {
      toast.error('This form has already been submitted');
      return;
    }
    
    // Validate form data
    if (!formData.studentName || !formData.department || !formData.signature) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate checkboxes
    if (!formData.readAndUnderstood || !formData.agreeToTerms) {
      toast.error('You must read and agree to all terms and conditions');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post('/api/clearance/forms/affidavit', formData, {
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
        <h2 className="text-xl font-bold text-[#1E3A8A]">Rules and Regulations Affidavit</h2>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          Please read the university rules and regulations carefully before signing this affidavit.
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
                    ? "Your affidavit has been approved." 
                    : "Your affidavit has been submitted and is awaiting approval."}
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
          {/* Student Information */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Student Information</h3>
          </div>
          
          {/* Student Name */}
          <div>
            <label htmlFor="studentName" className="block text-sm font-medium text-gray-700">
              Full Name <span className="text-red-500">*</span>
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
          
          {/* Faculty */}
          <div>
            <label htmlFor="faculty" className="block text-sm font-medium text-gray-700">
              Faculty/School <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="faculty"
                id="faculty"
                value={formData.faculty}
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
          
          {/* Rules and Regulations Section */}
          <div className="md:col-span-2 mt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">University Rules and Regulations</h3>
            
            {/* Rules list */}
            <div className="p-4 border rounded-md bg-gray-50 mb-4 max-h-80 overflow-y-auto">
              <h4 className="font-medium text-gray-900 mb-2">Please read the following rules and regulations carefully:</h4>
              <ul className="space-y-2">
                {rulesAndRegulations.map((rule, index) => (
                  <li key={index} className="text-gray-700">{rule}</li>
                ))}
              </ul>
            </div>
            
            {/* Agreement Checkbox */}
            <div className="space-y-4">
              <div className="relative flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="readAndUnderstood"
                    name="readAndUnderstood"
                    type="checkbox"
                    checked={formData.readAndUnderstood}
                    onChange={handleInputChange}
                    className="focus:ring-[#1E3A8A] h-4 w-4 text-[#1E3A8A] border-gray-300 rounded"
                    disabled={formStatus.submitted}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="readAndUnderstood" className="font-medium text-gray-700">
                    I have read and understood all the university rules and regulations
                  </label>
                </div>
              </div>
              
              <div className="relative flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="agreeToTerms"
                    name="agreeToTerms"
                    type="checkbox"
                    checked={formData.agreeToTerms}
                    onChange={handleInputChange}
                    className="focus:ring-[#1E3A8A] h-4 w-4 text-[#1E3A8A] border-gray-300 rounded"
                    disabled={formStatus.submitted}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="agreeToTerms" className="font-medium text-gray-700">
                    I agree to abide by all the university rules and regulations during my stay in the university
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          {/* Signature and Date Section */}
          <div className="md:col-span-2 mt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Signature and Date</h3>
          </div>
          
          {/* Date */}
          <div>
            <label htmlFor="agreementDate" className="block text-sm font-medium text-gray-700">
              Date <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <input
                type="date"
                name="agreementDate"
                id="agreementDate"
                value={formData.agreementDate}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-[#1E3A8A] focus:border-[#1E3A8A] block w-full sm:text-sm border-gray-300 rounded-md"
                required
                disabled={formStatus.submitted}
              />
            </div>
          </div>
          
          {/* Signature */}
          <div>
            <label htmlFor="signature" className="block text-sm font-medium text-gray-700">
              Digital Signature (Type your full name) <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="signature"
                id="signature"
                value={formData.signature}
                onChange={handleInputChange}
                className="shadow-sm focus:ring-[#1E3A8A] focus:border-[#1E3A8A] block w-full sm:text-sm border-gray-300 rounded-md"
                required
                disabled={formStatus.submitted}
                placeholder="Type your full name as your signature"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              By typing your full name, you are electronically signing this document.
            </p>
          </div>
        </div>
        
        {/* Declaration Notice */}
        <div className="rounded-md bg-blue-50 p-4 mt-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiInfo className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Declaration</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  I solemnly declare that I have read and understood all the rules and regulations of the university. 
                  I promise to abide by all these rules and regulations during my stay in the university. 
                  I am aware that any violation of these rules and regulations may result in disciplinary action, 
                  including expulsion from the university.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Legal Warning */}
        <div className="rounded-md bg-yellow-50 p-4 mt-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Legal Notice</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  This electronic signature constitutes a legal and binding agreement. 
                  False declaration or violation of these rules may lead to legal and disciplinary consequences.
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
                  Sign and Submit
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default AffidavitForm;