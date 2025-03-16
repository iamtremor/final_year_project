import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";
import { 
  FaArrowLeft, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaUser, 
  FaFileAlt,
  FaSchool,
  FaIdCard,
  FaGraduationCap,
  FaRegCalendarAlt,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaHome,
  FaGlobe,
  FaChalkboardTeacher,
  FaBook,
  FaBookOpen,
  FaHistory,
  FaSignature,
  FaCheck
} from "react-icons/fa";
import { FiClock, FiAlertTriangle, FiCheckCircle, FiXCircle, FiInfo } from "react-icons/fi";

const FormReviewPage = () => {
  const { formId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formType, setFormType] = useState('');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isViewOnly, setIsViewOnly] = useState(false);

  // Extract form type from URL query parameters and check if view only mode
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const typeParam = queryParams.get('type') || 'newClearance';
    console.log("Form type from URL:", typeParam);
    setFormType(typeParam);
    
    // Check if this is just for viewing (already approved/rejected)
    const viewMode = location.pathname.includes('view-form');
    setIsViewOnly(viewMode);
  }, [location.search, location.pathname]);

  // Fetch form data
  // When fetching the form data
useEffect(() => {
  const fetchFormData = async () => {
    try {
      setLoading(true);
      console.log(`Fetching form data for ID: ${formId}, Type: ${formType}`);
      
      // Fetch the specific form by ID
      const response = await api.get(`/clearance/forms/${formId}?formType=${formType}`);
      console.log("Form data response:", response.data);
      setForm(response.data);
      
      // If studentId is just a string (not populated), fetch student details separately
      if (response.data.studentId && typeof response.data.studentId === 'string') {
        try {
          const studentResponse = await api.get(`/users/profile/${response.data.studentId}`);
          console.log("Student info response:", studentResponse.data);
          setStudentInfo(studentResponse.data);
        } catch (studentError) {
          console.error('Error fetching student details:', studentError);
        }
      } else if (response.data.studentId && typeof response.data.studentId === 'object') {
        // If studentId is already populated, use it directly
        setStudentInfo(response.data.studentId);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching form data:', error);
      setError('Failed to load form data. Please try again later.');
      setLoading(false);
    }
  };

  if (formId && formType) {
    fetchFormData();
  }
}, [formId, formType]);

const canApproveForm = () => {
  if (!user || !form) return false;
  
  // For New Clearance Form
  if (formType === 'newClearance') {
    // Deputy Registrar specific approval logic
    if (user.department === 'Registrar') {
      // Check if the form is not already deputy registrar approved
      return !form.deputyRegistrarApproved;
    }
    
    // School Officer approval logic
    if (user.department === form.studentId?.department) {
      // Can approve if deputy registrar has already approved
      return form.deputyRegistrarApproved && !form.schoolOfficerApproved;
    }
  }
  
  // For other form types, keep existing logic
  if (['provAdmission', 'personalRecord', 'personalRecord2', 'affidavit'].includes(formType)) {
    // Simple check - form not yet approved
    return !form.approved;
  }
  
  return false;
};
  // Determine which approval type this staff member can perform
  const getApprovalType = () => {
    if (!user || !form) return null;
    
    if (formType === 'newClearance') {
      if (user.department === 'Registrar' && !form.deputyRegistrarApproved) {
        return 'deputyRegistrar';
      }
      
      if (user.department === form.studentId?.department && 
          form.deputyRegistrarApproved && 
          !form.schoolOfficerApproved) {
        return 'schoolOfficer';
      }
    }
    
    // For other form types, return a generic approval type
    return 'general';
  };

  // Helper function to get staff role from department
  const getStaffRoleFromDepartment = (department) => {
    switch (department) {
      case 'Registrar':
        return 'deputyRegistrar';
      case 'Student Support':
        return 'studentSupport';
      case 'Finance':
        return 'finance';
      case 'Library':
        return 'library';
      case 'Health Services':
        return 'health';
      default:
        // For academic departments, assume school officer or department head
        return department.includes('HOD') ? 'departmentHead' : 'schoolOfficer';
    }
  };

  // Handle form approval
  const handleApprove = async () => {
    try {
      setSubmitting(true);
      
      const approvalType = getApprovalType();
      if (!approvalType) {
        throw new Error('You do not have permission to approve this form');
      }
      
      const response = await api.post(`/api/clearance/forms/${formId}/approve`, {
        formType,
        approvalType,
        comments
      });
      
      setSuccessMessage('Form approved successfully!');
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/staff/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error approving form:', error);
      setError(
        error.response?.data?.message || 
        'Failed to approve form. Please try again later.'
      );
    } finally {
      setSubmitting(false);
    }
  };
  
  // Similar changes for handleReject method

  // Handle rejection
  const handleReject = async () => {
    try {
      setSubmitting(true);
      
      if (!comments) {
        setError('Please provide a reason for rejection');
        setSubmitting(false);
        return;
      }
      
      const approvalType = getApprovalType();
      if (!approvalType) {
        throw new Error('You do not have permission to reject this form');
      }
      
      console.log(`Rejecting form: ${formId}, type: ${formType}, approvalType: ${approvalType}`);
      
      // Submit form rejection
      const response = await api.post(`/clearance/forms/${formId}/reject`, {
        formType,
        approvalType,
        comments
      });
      
      console.log("Rejection response:", response.data);
      setSuccessMessage('Form rejected successfully!');
      setSuccess(true);
      
      // After successful rejection, wait 2 seconds and redirect back to dashboard
      setTimeout(() => {
        navigate('/staff/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error rejecting form:', error);
      setError('Failed to reject form. Please try again later.');
      setSubmitting(false);
    }
  };
  useEffect(() => {
    console.log('Form Review Debug:', {
      user: {
        id: user?.id,
        fullName: user?.fullName,
        department: user?.department,
        role: user?.role
      },
      form: form ? {
        _id: form._id,
        studentId: form.studentId,
        deputyRegistrarApproved: form.deputyRegistrarApproved,
        schoolOfficerApproved: form.schoolOfficerApproved
      } : null,
      formType,
      canApprove: canApproveForm(),
      approvalType: getApprovalType()
    });
  }, [user, form, formType]);
  // Render New Clearance Form details
  const renderNewClearanceForm = () => {
    if (!form) return null;
    
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
          <h3 className="font-medium text-lg text-blue-800 mb-2">Application Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Student Name</p>
              <p className="font-medium">{form.studentName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Application ID</p>
              <p className="font-medium">{studentInfo?.applicationId || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">JAMB Registration Number</p>
              <p className="font-medium">{form.jambRegNo}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Department</p>
              <p className="font-medium">{studentInfo?.department || "N/A"}</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <FaIdCard className="text-blue-600 mr-2" />
              Qualification Details
            </h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <ul className="space-y-3">
                <li className="flex items-center">
                  <div className={`w-6 h-6 flex items-center justify-center rounded-full mr-3 ${form.oLevelQualification ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                    {form.oLevelQualification ? '✓' : '✗'}
                  </div>
                  <span className="text-gray-700">O-Level Qualification</span>
                </li>
                <li className="flex items-center">
                  <div className={`w-6 h-6 flex items-center justify-center rounded-full mr-3 ${form.changeOfCourse ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                    {form.changeOfCourse ? '✓' : '✗'}
                  </div>
                  <span className="text-gray-700">Change of Course</span>
                </li>
                <li className="flex items-center">
                  <div className={`w-6 h-6 flex items-center justify-center rounded-full mr-3 ${form.changeOfInstitution ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                    {form.changeOfInstitution ? '✓' : '✗'}
                  </div>
                  <span className="text-gray-700">Change of Institution</span>
                </li>
                <li className="flex items-center">
                  <div className={`w-6 h-6 flex items-center justify-center rounded-full mr-3 ${form.uploadOLevel ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                    {form.uploadOLevel ? '✓' : '✗'}
                  </div>
                  <span className="text-gray-700">Upload O-Level</span>
                </li>
                <li className="flex items-center">
                  <div className={`w-6 h-6 flex items-center justify-center rounded-full mr-3 ${form.jambAdmissionLetter ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                    {form.jambAdmissionLetter ? '✓' : '✗'}
                  </div>
                  <span className="text-gray-700">JAMB Admission Letter</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <FaUser className="text-blue-600 mr-2" />
              Student Details
            </h3>
            <div className="bg-gray-50 p-4 rounded-md">
              {studentInfo ? (
                <div className="space-y-2">
                  <p className="flex items-center">
                    <FaPhone className="text-blue-500 mr-2" />
                    <span className="text-gray-500 mr-2">Phone:</span>
                    <span>{studentInfo.phoneNumber}</span>
                  </p>
                  <p className="flex items-center">
                    <FaEnvelope className="text-blue-500 mr-2" />
                    <span className="text-gray-500 mr-2">Email:</span>
                    <span>{studentInfo.email}</span>
                  </p>
                  <p className="flex items-center">
                    <FaRegCalendarAlt className="text-blue-500 mr-2" />
                    <span className="text-gray-500 mr-2">Date of Birth:</span>
                    <span>{studentInfo.dateOfBirth ? new Date(studentInfo.dateOfBirth).toLocaleDateString() : 'N/A'}</span>
                  </p>
                </div>
              ) : (
                <p className="text-gray-500">Additional student details not available</p>
              )}
            </div>
            
            <div className="mt-4 bg-gray-50 p-4 rounded-md">
              <div className="flex items-center mb-2">
                <FiClock className="text-blue-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">Form Timeline:</span>
              </div>
              <div className="ml-6 border-l-2 border-blue-200 pl-4 space-y-3">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 -ml-[9px]"></div>
                  <div className="ml-2">
                    <p className="text-sm font-medium">Submitted</p>
                    <p className="text-xs text-gray-500">{new Date(form.submittedDate).toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className={`w-2 h-2 rounded-full mt-1.5 -ml-[9px] ${form.deputyRegistrarApproved ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  <div className="ml-2">
                    <p className="text-sm font-medium">Deputy Registrar Review</p>
                    <p className="text-xs text-gray-500">
                      {form.deputyRegistrarApproved 
                        ? `Approved on ${form.deputyRegistrarApprovalDate ? new Date(form.deputyRegistrarApprovalDate).toLocaleString() : 'unknown date'}`
                        : 'Pending'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className={`w-2 h-2 rounded-full mt-1.5 -ml-[9px] ${
                    !form.deputyRegistrarApproved ? 'bg-gray-300' : 
                    form.schoolOfficerApproved ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></div>
                  <div className="ml-2">
                    <p className="text-sm font-medium">School Officer Review</p>
                    <p className="text-xs text-gray-500">
                      {!form.deputyRegistrarApproved 
                        ? 'Awaiting Deputy Registrar approval'
                        : form.schoolOfficerApproved
                          ? `Approved on ${form.schoolOfficerApprovalDate ? new Date(form.schoolOfficerApprovalDate).toLocaleString() : 'unknown date'}`
                          : 'Pending'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Provisional Admission Form details
  const renderProvAdmissionForm = () => {
    if (!form) return null;
    
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
          <h3 className="font-medium text-lg text-blue-800 mb-2">Provisional Admission Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Student Name</p>
              <p className="font-medium">{form.studentName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Application ID</p>
              <p className="font-medium">{studentInfo?.applicationId || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Department</p>
              <p className="font-medium">{form.department}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Course</p>
              <p className="font-medium">{form.course}</p>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
            <FaSchool className="text-blue-600 mr-2" />
            Approval Status
          </h3>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="font-medium text-gray-700 mb-2">Required Approvals</h4>
            <div className="space-y-3">
              {form.approvals && form.approvals.map((approval, index) => (
                <div key={index} className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50">
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full mr-3 ${
                    approval.approved ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                  }`}>
                    {approval.approved ? <FiCheckCircle size={18} /> : <FiClock size={18} />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{formatStaffRole(approval.staffRole)}</p>
                    <p className="text-sm text-gray-500">
                      {approval.approved 
                        ? `Approved on ${approval.approvedDate ? new Date(approval.approvedDate).toLocaleDateString() : 'unknown date'}` 
                        : 'Pending approval'}
                    </p>
                  </div>
                  {approval.comments && (
                    <div className="ml-2 text-gray-500 text-sm">
                      <p>Comment: {approval.comments}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-4 bg-gray-50 p-4 rounded-md">
            <div className="flex items-center mb-2">
              <FiClock className="text-blue-600 mr-2" />
              <span className="text-sm font-medium text-gray-700">Form Timeline:</span>
            </div>
            <div className="ml-6 border-l-2 border-blue-200 pl-4 space-y-3">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 -ml-[9px]"></div>
                <div className="ml-2">
                  <p className="text-sm font-medium">Submitted</p>
                  <p className="text-xs text-gray-500">{new Date(form.submittedDate).toLocaleString()}</p>
                </div>
              </div>
              
              {form.approved && (
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 -ml-[9px]"></div>
                  <div className="ml-2">
                    <p className="text-sm font-medium">All Approvals Complete</p>
                    <p className="text-xs text-gray-500">
                      {form.approvedDate ? new Date(form.approvedDate).toLocaleString() : 'Unknown date'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Format staff role for display
  const formatStaffRole = (role) => {
    switch (role) {
      case 'deputyRegistrar': return 'Deputy Registrar';
      case 'schoolOfficer': return 'School Officer';
      case 'departmentHead': return 'Department Head';
      case 'studentSupport': return 'Student Support Services';
      case 'finance': return 'Finance Department';
      case 'library': return 'Library';
      case 'health': return 'Health Services';
      default: return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  // Render Personal Record Form details
  const renderPersonalRecordForm = () => {
    if (!form) return null;
    
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
          <h3 className="font-medium text-lg text-blue-800 mb-2">Student Personal Record</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Full Name</p>
              <p className="font-medium">{form.fullName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Application ID</p>
              <p className="font-medium">{studentInfo?.applicationId || "N/A"}</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <FaUser className="text-blue-600 mr-2" />
              Personal Information
            </h3>
            
            <div className="bg-gray-50 p-4 rounded-md space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Gender</p>
                  <p className="font-medium">{form.gender}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <p className="font-medium">{form.dateOfBirth ? new Date(form.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Marital Status</p>
                  <p className="font-medium">{form.maritalStatus}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Religion</p>
                  <p className="font-medium">{form.religion || 'N/A'}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Blood Group</p>
                <p className="font-medium">{form.bloodGroup || 'N/A'}</p>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <FaMapMarkerAlt className="text-blue-600 mr-2" />
              Location Information
            </h3>
            
            <div className="bg-gray-50 p-4 rounded-md space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Home Town</p>
                  <p className="font-medium">{form.homeTown || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">State of Origin</p>
                  <p className="font-medium">{form.stateOfOrigin}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nationality</p>
                  <p className="font-medium">{form.nationality}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Next of Kin</p>
                  <p className="font-medium">{form.nextOfKin}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Home Address</p>
                <p className="font-medium">{form.homeAddress}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-md">
          <div className="flex items-center mb-2">
            <FiClock className="text-blue-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Form Status:</span>
          </div>
          <div className="flex items-center">
            <div className={`w-4 h-4 rounded-full ${form.approved ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <p className="ml-2 font-medium">
              {form.approved ? 'Approved' : 'Pending Approval'}
              {form.approved && form.approvedDate && (
                <span className="ml-2 text-sm text-gray-500">
                  on {new Date(form.approvedDate).toLocaleDateString()}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Render Personal Record 2 Form details
  const renderPersonalRecord2Form = () => {
    if (!form) return null;
    
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
          <h3 className="font-medium text-lg text-blue-800 mb-2">Family Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Parent/Guardian Name</p>
              <p className="font-medium">{form.parentGuardianName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Student</p>
              <p className="font-medium">{studentInfo?.fullName || "N/A"}</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <FaUser className="text-blue-600 mr-2" />
              Parent/Guardian Information
            </h3>
            
            <div className="bg-gray-50 p-4 rounded-md space-y-4">
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium">{form.parentGuardianAddress}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">State of Origin</p>
                  <p className="font-medium">{form.parentGuardianOrigin}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Country</p>
                  <p className="font-medium">{form.parentGuardianCountry}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone Number</p>
                  <p className="font-medium">{form.parentGuardianPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{form.parentGuardianEmail || 'N/A'}</p>
                </div>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-700 mt-6 mb-4 flex items-center">
              <FaUser className="text-blue-600 mr-2" />
              Father's Information
            </h3>
            
            <div className="bg-gray-50 p-4 rounded-md space-y-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{form.fatherName || 'N/A'}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium">{form.fatherAddress || 'N/A'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Phone Number</p>
                  <p className="font-medium">{form.fatherPhone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Occupation</p>
                  <p className="font-medium">{form.fatherOccupation || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <FaUser className="text-blue-600 mr-2" />
              Mother's Information
            </h3>
            
            <div className="bg-gray-50 p-4 rounded-md space-y-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{form.motherName || 'N/A'}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium">{form.motherAddress || 'N/A'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Phone Number</p>
                  <p className="font-medium">{form.motherPhone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Occupation</p>
                  <p className="font-medium">{form.motherOccupation || 'N/A'}</p>
                </div>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-700 mt-6 mb-4 flex items-center">
              <FaGraduationCap className="text-blue-600 mr-2" />
              Educational Background
            </h3>
            
            <div className="bg-gray-50 p-4 rounded-md">
              {form.educationHistory && form.educationHistory.length > 0 ? (
                <div className="space-y-4">
                  {form.educationHistory.map((education, index) => (
                    <div key={index} className="p-3 border border-gray-200 rounded-md">
                      <p className="font-medium">{education.schoolName}</p>
                      <p className="text-sm text-gray-600">{education.schoolAddress || 'No address provided'}</p>
                      <div className="flex text-xs text-gray-500 mt-1">
                        <span>{education.startDate || 'Unknown start'}</span>
                        <span className="mx-2">to</span>
                        <span>{education.endDate || 'Unknown end'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No educational history provided</p>
              )}
              
              <div className="mt-4">
                <p className="text-sm text-gray-500">Qualifications</p>
                <p className="font-medium">{form.qualifications || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-md">
          <div className="flex items-center mb-2">
            <FiClock className="text-blue-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Form Status:</span>
          </div>
          <div className="flex items-center">
            <div className={`w-4 h-4 rounded-full ${form.approved ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <p className="ml-2 font-medium">
              {form.approved ? 'Approved' : 'Pending Approval'}
              {form.approved && form.approvedDate && (
                <span className="ml-2 text-sm text-gray-500">
                  on {new Date(form.approvedDate).toLocaleDateString()}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Render Affidavit Form details
  const renderAffidavitForm = () => {
    if (!form) return null;
    
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
          <h3 className="font-medium text-lg text-blue-800 mb-2">Rules & Regulations Affidavit</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Student Name</p>
              <p className="font-medium">{form.studentName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Faculty</p>
              <p className="font-medium">{form.faculty}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Department</p>
              <p className="font-medium">{form.department}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Course</p>
              <p className="font-medium">{form.course}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
            <FaBook className="text-blue-600 mr-2" />
            Agreement Details
          </h3>
          
          <div className="mb-4 p-4 bg-blue-50 rounded border border-blue-100 text-gray-700">
            <p>
              I, <span className="font-semibold">{form.studentName}</span>, hereby acknowledge that I have read, 
              understood, and agree to abide by all the rules, regulations, and policies of the institution 
              as outlined in the Student Handbook.
            </p>
            <p className="mt-2">
              I understand that any violation of these rules and regulations may result in disciplinary action,
              up to and including dismissal from the institution.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Agreement Date</p>
              <p className="font-medium">{new Date(form.agreementDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Digital Signature</p>
              <div className="p-2 border border-gray-300 rounded bg-white">
                <p className="font-medium italic">{form.signature}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-md">
          <div className="flex items-center mb-2">
            <FiClock className="text-blue-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Form Status:</span>
          </div>
          <div className="flex items-center">
            <div className={`w-4 h-4 rounded-full ${form.approved ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <p className="ml-2 font-medium">
              {form.approved ? 'Approved' : 'Pending Approval'}
              {form.approved && form.approvedDate && (
                <span className="ml-2 text-sm text-gray-500">
                  on {new Date(form.approvedDate).toLocaleDateString()}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Render form content based on form type
  const renderFormContent = () => {
    if (!form) return null;
    
    switch (formType) {
      case 'newClearance':
        return renderNewClearanceForm();
      case 'provAdmission':
        return renderProvAdmissionForm();
      case 'personalRecord':
        return renderPersonalRecordForm();
      case 'personalRecord2':
        return renderPersonalRecord2Form();
      case 'affidavit':
        return renderAffidavitForm();
      default:
        return (
          <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
            <div className="flex items-center">
              <FiAlertTriangle className="text-yellow-500 mr-2" />
              <span>Unknown form type or preview not available</span>
            </div>
          </div>
        );
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  // Show error state
  if (error && !success) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
        <button 
          onClick={() => navigate(-1)} 
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded flex items-center"
        >
          <FaArrowLeft className="mr-2" />
          Go Back
        </button>
      </div>
    );
  }

  // Show success state
  if (success) {
    return (
      <div className="p-6">
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative flex items-center" role="alert">
          <FaCheckCircle className="mr-2" />
          <span className="block sm:inline">{successMessage || 'Action completed successfully!'} Redirecting...</span>
        </div>
      </div>
    );
  }

  // Find which approval action this staff can take
  const approvalType = getApprovalType();
  const formTitle = formType === 'newClearance' ? 'New Clearance Form' :
                   formType === 'provAdmission' ? 'Provisional Admission Form' :
                   formType === 'personalRecord' ? 'Personal Record Form' :
                   formType === 'personalRecord2' ? 'Family Information Form' :
                   formType === 'affidavit' ? 'Rules & Regulations Affidavit' :
                   'Student Form';

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FaFileAlt size={24} className="text-[#1E3A8A] mr-2" />
          <h2 className="text-2xl font-bold text-[#1E3A8A]">
            {isViewOnly ? 'View' : 'Review'} {formTitle}
          </h2>
        </div>
        <button 
          onClick={() => navigate(-1)} 
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded flex items-center"
        >
          <FaArrowLeft className="mr-2" />
          Back
        </button>
      </div>

      {/* Form approval status panel */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 pb-4 border-b">
          <div>
            <h3 className="text-xl font-semibold text-gray-800">
              {formTitle}
            </h3>
            <p className="text-gray-500 text-sm mt-1">
              Submitted by {form?.studentName || form?.fullName || 'Student'} on {form ? new Date(form.submittedDate).toLocaleString() : ''}
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            {formType === 'newClearance' && (
              <div className="flex flex-col items-end space-y-2">
                <div className="flex items-center">
                  <span className="text-sm mr-2">Deputy Registrar:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    form?.deputyRegistrarApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {form?.deputyRegistrarApproved ? 'Approved' : 'Pending'}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm mr-2">School Officer:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    form?.schoolOfficerApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {form?.schoolOfficerApproved ? 'Approved' : 'Pending'}
                  </span>
                </div>
              </div>
            )}
            
            {(formType !== 'newClearance' && formType !== 'provAdmission') && (
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                form?.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {form?.approved ? 'Approved' : 'Pending Approval'}
              </span>
            )}
            
            {(formType === 'provAdmission') && (
              <div className="flex items-center">
                <span className="text-sm mr-2">Overall Status:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  form?.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {form?.approved ? 'All Approvals Complete' : 'Pending Approvals'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Form content */}
        <div>
          {renderFormContent()}
        </div>
      </div>

      {/* Approval actions - only show if not in view-only mode and staff can approve */}
      {/* Approval actions - only show if not in view-only mode and staff can approve */}
{approvalType && !isViewOnly && (
  <div className="bg-white rounded-lg shadow-md p-6">
    <h3 className="text-lg font-semibold mb-4">Verification Action</h3>
    
    {/* Approval Information Panel */}
    <div className="bg-blue-50 p-4 rounded-md mb-6 border border-blue-100">
      <div className="flex items-start">
        <FiInfo className="text-blue-500 mr-2 mt-1" />
        <div>
          <p className="font-medium text-blue-800">Approval Information</p>
          <p className="text-sm text-blue-700 mt-1">
            {approvalType === 'deputyRegistrar' && 
              "As a Deputy Registrar, you are reviewing the initial clearance form before School Officer review."}
            {approvalType === 'schoolOfficer' && 
              "As a School Officer, you are completing the clearance process after Deputy Registrar's verification."}
          </p>
        </div>
      </div>
    </div>
    
    <div className="mb-4">
      <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-2">
        Comments {approvalType && <span className="text-red-500">*</span>}
        <span className="text-gray-500 text-xs ml-1">(Required for rejection, Optional for approval)</span>
      </label>
      <textarea
        id="comments"
        rows="3"
        className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="Enter any comments about your verification decision..."
        value={comments}
        onChange={(e) => setComments(e.target.value)}
      />
    </div>
    
    <div className="flex flex-col sm:flex-row gap-3 justify-end">
      <button
        onClick={handleReject}
        disabled={submitting}
        className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded flex items-center justify-center"
      >
        {submitting ? (
          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
        ) : (
          <>
            <FaTimesCircle className="mr-2" />
            Reject Form
          </>
        )}
      </button>
      
      <button
        onClick={handleApprove}
        disabled={submitting}
        className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded flex items-center justify-center"
      >
        {submitting ? (
          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
        ) : (
          <>
            <FaCheckCircle className="mr-2" />
            Approve Form
          </>
        )}
      </button>
    </div>
  </div>
)}
      
      {/* Staff notes section - shows only in view mode for already approved or rejected forms */}
      {isViewOnly && form && (form.comments || form.feedback) && (
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">
            {form.status === 'rejected' ? 'Rejection Reason' : 'Approval Notes'}
          </h3>
          
          <div className={`p-4 rounded-md ${
            form.status === 'rejected' ? 'bg-red-50 border border-red-100' : 'bg-green-50 border border-green-100'
          }`}>
            <div className="flex items-start">
              {form.status === 'rejected' ? (
                <FaTimesCircle className="text-red-500 mr-2 mt-1" />
              ) : (
                <FaCheckCircle className="text-green-500 mr-2 mt-1" />
              )}
              <div>
                <p className={`font-medium ${form.status === 'rejected' ? 'text-red-800' : 'text-green-800'}`}>
                  {form.status === 'rejected' ? 'This form was rejected' : 'This form was approved'}
                </p>
                <p className={`mt-1 ${form.status === 'rejected' ? 'text-red-700' : 'text-green-700'}`}>
                  {form.comments || form.feedback || 'No comment provided'}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {form.reviewedBy ? `Reviewed by: ${form.reviewedBy.fullName || 'Staff Member'}` : ''}
                  {form.reviewDate ? ` on ${new Date(form.reviewDate).toLocaleString()}` : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormReviewPage;
