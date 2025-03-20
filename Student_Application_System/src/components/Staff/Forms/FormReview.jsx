import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { 
  FiCheckCircle, 
  FiXCircle, 
  FiAlertTriangle, 
  FiFileText, 
  FiClipboard 
} from "react-icons/fi";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../utils/api";
import { Toaster } from 'react-hot-toast';

const FormReviewPage = () => {
  const { formId } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const formType = queryParams.get("formType");
  const { user } = useAuth();
  
  const [form, setForm] = useState(null);
  const [student, setStudent] = useState(null);
  const [comments, setComments] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // Get normalized form type for display
  const getNormalizedFormTypeName = (type) => {
    switch(type) {
      case 'newClearance': return 'New Clearance Form';
      case 'provAdmission': return 'Provisional Admission Form';
      case 'personalRecord': return 'Personal Record Form';
      case 'personalRecord2': return 'Personal Record Form Part 2';
      case 'affidavit': return 'Rules & Affidavit Form';
      default: return type || 'Unknown Form';
    }
  };

  // Determine approval type based on user's department and form type
  const getApprovalType = () => {
    if (!user || !formType) return null;
    
    if (formType === 'newClearance') {
      if (user.department === 'Registrar') {
        return 'deputyRegistrar';
      } else if (!user.department.includes('HOD') && 
                !['Student Support', 'Finance', 'Health Services', 'Library'].includes(user.department)) {
        return 'schoolOfficer';
      }
    } else if (formType === 'provAdmission') {
      // For provisional admission, each staff has a role
      if (user.department === 'Registrar') {
        return 'deputyRegistrar';
      } else if (user.department.includes('HOD')) {
        return 'departmentHead';
      } else if (user.department === 'Student Support') {
        return 'studentSupport';
      } else if (user.department === 'Finance') {
        return 'finance';
      } else if (user.department === 'Library') {
        return 'library';
      } else if (user.department === 'Health Services') {
        return 'health';
      } else if (!user.department.includes('HOD') && 
                !['Student Support', 'Finance', 'Health Services', 'Library'].includes(user.department)) {
        return 'schoolOfficer';
      }
    } else {
      // For other forms, use a simple approach
      return user.department;
    }
    
    return null;
  };

  // Check if user can approve this form type
  const canApproveForm = () => {
    return !!getApprovalType();
  };

  useEffect(() => {
    const fetchFormDetails = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/clearance/forms/${formId}?formType=${formType}`);
        setForm(response.data);
        
        // Set student data if available in the response
        if (response.data.studentId) {
          if (typeof response.data.studentId === 'object') {
            setStudent(response.data.studentId);
          } else {
            try {
              const studentResponse = await api.get(`/users/profile/${response.data.studentId}`);
              setStudent(studentResponse.data);
            } catch (err) {
              console.error("Failed to fetch student details:", err);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching form details:', err);
        setError('Could not load form details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    if (formId && formType) {
      fetchFormDetails();
    } else {
      setError('Missing form ID or type');
      setIsLoading(false);
    }
  }, [formId, formType]);

  const handleApproveForm = async () => {
    try {
      const approvalType = getApprovalType();
      
      if (!approvalType) {
        setError('You do not have permission to approve this form.');
        return;
      }
      
      setSubmitting(true);
      setError(null);
      
      await api.post(`/clearance/forms/${formId}/approve`, {
        formType,
        approvalType,
        comments
      });
      
      // Update local state to show approval
      if (formType === 'newClearance') {
        setForm(prev => ({
          ...prev,
          deputyRegistrarApproved: approvalType === 'deputyRegistrar' ? true : prev.deputyRegistrarApproved,
          schoolOfficerApproved: approvalType === 'schoolOfficer' ? true : prev.schoolOfficerApproved
        }));
      } else if (formType === 'provAdmission') {
        // For provisional admission, update the specific approval
        setForm(prev => {
          const updatedApprovals = prev.approvals.map(approval => {
            if (approval.staffRole === approvalType) {
              return {
                ...approval,
                approved: true,
                staffId: user._id,
                approvedDate: new Date().toISOString(),
                comments: comments
              };
            }
            return approval;
          });
          
          // Check if all approvals are now complete
          const allApproved = updatedApprovals.every(a => a.approved);
          
          return {
            ...prev,
            approvals: updatedApprovals,
            approved: allApproved,
            approvedDate: allApproved ? new Date().toISOString() : prev.approvedDate
          };
        });
      } else {
        // For other forms, just mark as approved
        setForm(prev => ({
          ...prev,
          approved: true,
          approvedDate: new Date().toISOString()
        }));
      }
      
      setSuccessMessage('Form has been approved successfully.');
    } catch (err) {
      console.error('Error approving form:', err);
      setError('Could not approve form. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper function to check if this form has already been approved by this staff role
  const isAlreadyApproved = () => {
    if (!form || !user) return false;
    
    const approvalType = getApprovalType();
    
    if (formType === 'newClearance') {
      return (approvalType === 'deputyRegistrar' && form.deputyRegistrarApproved) ||
             (approvalType === 'schoolOfficer' && form.schoolOfficerApproved);
    } else if (formType === 'provAdmission') {
      return form.approvals?.some(approval => 
        approval.staffRole === approvalType && approval.approved
      );
    } else {
      return form.approved;
    }
  };

  // Helper function to determine required approver roles
  const getRequiredApproverRoles = () => {
    if (!formType) return 'Unknown';
    
    switch(formType) {
      case 'newClearance': 
        return 'Deputy Registrar (Registrar Department) or School Officer';
      case 'provAdmission':
        return 'Various departmental roles';
      case 'personalRecord':
        return 'Student Support Department';
      case 'personalRecord2':
        return 'Registrar Department';
      case 'affidavit':
        return 'Legal Department';
      default:
        return 'Unknown';
    }
  };

  // Helper function to format staff role names
  const formatRoleName = (role) => {
    switch(role) {
      case 'deputyRegistrar': return 'Deputy Registrar';
      case 'schoolOfficer': return 'School Officer';
      case 'departmentHead': return 'Department Head';
      case 'studentSupport': return 'Student Support';
      case 'finance': return 'Finance';
      case 'library': return 'Library';
      case 'health': return 'Health Services';
      default: return role;
    }
  };

  return (
    <div
      style={{ backgroundColor: "#F6F6F6" }}
      className="w-full h-full overflow-auto"
    >
      <Toaster position="top-right" />
      <div className="text-2xl font-bold text-[#1E3A8A] mx-6 flex items-center">
        <FiClipboard className="mr-2" />
        <h2 className="m-2">Form Review: {formType && getNormalizedFormTypeName(formType)}</h2>
      </div>
      
      {successMessage && (
        <div className="mx-5 mb-4 p-3 bg-green-100 border-l-4 border-green-500 text-green-700">
          <p className="font-bold">{successMessage}</p>
        </div>
      )}
      
      {error && (
        <div className="mx-5 mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700">
          <div className="flex">
            <FiAlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <div>
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Action Bar */}
      <div className="mx-5 mb-4 p-4 bg-white rounded-md shadow-sm flex justify-between items-center">
        <div className="flex items-center">
          {form && (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              isAlreadyApproved() 
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {isAlreadyApproved() ? 'Approved' : 'Pending Approval'}
            </span>
          )}
        </div>
        
        <button
          onClick={() => window.history.back()}
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
        >
          Back
        </button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1E3A8A]"></div>
        </div>
      ) : !form ? (
        <div className="mx-5 bg-white rounded-lg shadow-sm p-8 text-center">
          <FiAlertTriangle className="mx-auto text-5xl text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Form Not Found</h2>
          <p className="text-gray-600 mb-4">
            The form you are looking for could not be found.
          </p>
          <button 
            onClick={() => window.history.back()}
            className="bg-[#1E3A8A] text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Forms
          </button>
        </div>
      ) : (
        <>
          {/* Main content grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-5 mb-6">
            {/* Left column: Student Information */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-md shadow-sm p-5 h-full">
                <h3 className="text-lg font-medium text-[#1E3A8A] mb-4">Student Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{student?.fullName || form?.studentName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Application ID</p>
                    <p className="font-medium">{student?.applicationId || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Department</p>
                    <p className="font-medium">{student?.department || form?.department || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{student?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Submission Date</p>
                    <p className="font-medium">{form?.submittedDate ? new Date(form.submittedDate).toLocaleString() : 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right column: Form Details */}
            <div className="md:col-span-2">
              <div className="bg-white rounded-md shadow-sm p-5">
                <h3 className="text-lg font-medium text-[#1E3A8A] mb-4">Form Details</h3>
                
                {/* Form content based on type */}
                
                {/* New Clearance Form specific fields */}
                {formType === 'newClearance' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">JAMB Registration Number</p>
                        <p className="font-medium">{form?.jambRegNo || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">Declarations</p>
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        {form?.oLevelQualification && <li>Has O'Level qualification</li>}
                        {form?.changeOfCourse && <li>Change of course requested</li>}
                        {form?.changeOfInstitution && <li>Change of institution requested</li>}
                        {form?.uploadOLevel && <li>Will upload O'Level certificate</li>}
                        {form?.jambAdmissionLetter && <li>Has JAMB admission letter</li>}
                      </ul>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded border">
                        <div className="flex items-center mb-2">
                          {form?.deputyRegistrarApproved ? (
                            <FiCheckCircle className="text-green-500 mr-2" />
                          ) : (
                            <FiAlertTriangle className="text-yellow-500 mr-2" />
                          )}
                          <h3 className="font-medium">Deputy Registrar Approval</h3>
                        </div>
                        <p className="text-sm text-gray-600">
                          {form?.deputyRegistrarApproved ? (
                            "Approved"
                          ) : (
                            "Pending approval from Deputy Registrar"
                          )}
                        </p>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded border">
                        <div className="flex items-center mb-2">
                          {form?.schoolOfficerApproved ? (
                            <FiCheckCircle className="text-green-500 mr-2" />
                          ) : (
                            <FiAlertTriangle className="text-yellow-500 mr-2" />
                          )}
                          <h3 className="font-medium">School Officer Approval</h3>
                        </div>
                        <p className="text-sm text-gray-600">
                          {form?.schoolOfficerApproved ? (
                            "Approved"
                          ) : (
                            "Pending approval from School Officer"
                          )}
                        </p>
                      </div>
                    </div>
                  </>
                )}
                
                {/* Provisional Admission Form specific fields */}
                {formType === 'provAdmission' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Department</p>
                        <p className="font-medium">{form?.department || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Course</p>
                        <p className="font-medium">{form?.course || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="mb-1">
                      <p className="text-sm text-gray-600 font-medium mb-2">Approval Status</p>
                    </div>
                    
                    <div className="bg-gray-50 border rounded-md overflow-hidden mb-4">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Role</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Comments</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {form?.approvals?.map((approval, index) => (
                            <tr key={index} className={approval.approved ? "bg-green-50" : ""}>
                              <td className="px-4 py-2 text-sm">{formatRoleName(approval.staffRole)}</td>
                              <td className="px-4 py-2 text-sm">
                                {approval.approved ? (
                                  <span className="text-green-600 flex items-center">
                                    <FiCheckCircle className="mr-1" /> Approved
                                  </span>
                                ) : (
                                  <span className="text-yellow-600 flex items-center">
                                    <FiAlertTriangle className="mr-1" /> Pending
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-2 text-sm">
                                {approval.approvedDate ? new Date(approval.approvedDate).toLocaleDateString() : '-'}
                              </td>
                              <td className="px-4 py-2 text-sm">{approval.comments || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
                
                {/* Personal Record Form specific fields */}
                {formType === 'personalRecord' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Full Name</p>
                      <p className="font-medium">{form?.fullName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Matric Number</p>
                      <p className="font-medium">{form?.matricNo || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">School/Faculty</p>
                      <p className="font-medium">{form?.schoolFaculty || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Course</p>
                      <p className="font-medium">{form?.course || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Gender</p>
                      <p className="font-medium">{form?.gender || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Date of Birth</p>
                      <p className="font-medium">{form?.dateOfBirth ? new Date(form.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Marital Status</p>
                      <p className="font-medium">{form?.maritalStatus || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Religion</p>
                      <p className="font-medium">{form?.religion || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">State of Origin</p>
                      <p className="font-medium">{form?.stateOfOrigin || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Nationality</p>
                      <p className="font-medium">{form?.nationality || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Home Address</p>
                      <p className="font-medium">{form?.homeAddress || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Next of Kin</p>
                      <p className="font-medium">{form?.nextOfKin || 'N/A'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600">Approval Status</p>
                      <p className="font-medium">
                        {form?.approved ? (
                          <span className="text-green-600 flex items-center">
                            <FiCheckCircle className="mr-1" /> Approved
                          </span>
                        ) : (
                          <span className="text-yellow-600 flex items-center">
                            <FiAlertTriangle className="mr-1" /> Pending
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Personal Record 2 Form specific fields */}
                {formType === 'personalRecord2' && (
                  <div>
                    <div className="mb-6">
                      <h4 className="text-md font-medium text-[#1E3A8A] mb-3">Parent/Guardian Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Name</p>
                          <p className="font-medium">{form?.parentGuardianName || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Address</p>
                          <p className="font-medium">{form?.parentGuardianAddress || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">State of Origin</p>
                          <p className="font-medium">{form?.parentGuardianOrigin || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Country</p>
                          <p className="font-medium">{form?.parentGuardianCountry || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Phone</p>
                          <p className="font-medium">{form?.parentGuardianPhone || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium">{form?.parentGuardianEmail || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <h4 className="text-md font-medium text-[#1E3A8A] mb-3">Parents Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Father's Name</p>
                          <p className="font-medium">{form?.fatherName || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Mother's Name</p>
                          <p className="font-medium">{form?.motherName || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Father's Occupation</p>
                          <p className="font-medium">{form?.fatherOccupation || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Mother's Occupation</p>
                          <p className="font-medium">{form?.motherOccupation || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                    
                    {form?.educationHistory && form.educationHistory.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-md font-medium text-[#1E3A8A] mb-3">Educational Background</h4>
                        <div className="bg-gray-50 border rounded-md overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">School Name</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Address</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Start Date</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">End Date</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {form.educationHistory.map((school, index) => (
                                <tr key={index}>
                                  <td className="px-4 py-2 text-sm">{school.schoolName}</td>
                                  <td className="px-4 py-2 text-sm">{school.schoolAddress || '-'}</td>
                                  <td className="px-4 py-2 text-sm">{school.startDate || '-'}</td>
                                  <td className="px-4 py-2 text-sm">{school.endDate || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    
                    <div className="bg-gray-50 p-3 rounded border">
                      <div className="flex items-center mb-2">
                        {form?.approved ? (
                          <FiCheckCircle className="text-green-500 mr-2" />
                        ) : (
                          <FiAlertTriangle className="text-yellow-500 mr-2" />
                        )}
                        <h3 className="font-medium">Approval Status</h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        {form?.approved ? (
                          "This form has been approved."
                        ) : (
                          "This form is pending approval."
                        )}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Affidavit Form specific fields */}
                {formType === 'affidavit' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Student Name</p>
                      <p className="font-medium">{form?.studentName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Faculty</p>
                      <p className="font-medium">{form?.faculty || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Department</p>
                      <p className="font-medium">{form?.department || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Course</p>
                      <p className="font-medium">{form?.course || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Agreement Date</p>
                      <p className="font-medium">{form?.agreementDate ? new Date(form.agreementDate).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Signature</p>
                      <p className="font-medium">{form?.signature || 'N/A'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600">Approval Status</p>
                      <p className="font-medium">
                        {form?.approved ? (
                          <span className="text-green-600 flex items-center">
                            <FiCheckCircle className="mr-1" /> Approved
                          </span>
                        ) : (
                          <span className="text-yellow-600 flex items-center">
                            <FiAlertTriangle className="mr-1" /> Pending
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Form Approval Action Section */}
          {!isAlreadyApproved() && canApproveForm() && (
            <div className="mx-5 mb-6">
              <div className="bg-white rounded-md shadow-sm p-5">
                <h3 className="text-lg font-medium text-[#1E3A8A] mb-4">Form Approval</h3>
                
                <div className="mb-4">
                  <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-1">
                    Comments
                  </label>
                  <textarea
                    id="comments"
                    rows="4"
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                    placeholder="Enter any comments regarding this form (optional)"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                  ></textarea>
                </div>
                
                <button
                  onClick={handleApproveForm}
                  disabled={submitting}
                  className="flex items-center justify-center bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                >
                  <FiCheckCircle className="mr-2" /> 
                  {submitting ? "Processing..." : "Approve Form"}
                </button>
              </div>
            </div>
          )}
          
          {/* Already Approved Section */}
          {isAlreadyApproved() && (
            <div className="mx-5 mb-6">
              <div className="bg-white rounded-md shadow-sm p-5">
                <div className="bg-green-50 p-4 rounded-md text-green-700 flex items-start">
                  <FiCheckCircle className="mt-1 mr-3 flex-shrink-0 text-xl" />
                  <div>
                    <p className="font-semibold">This form has already been approved by you</p>
                    {formType === 'provAdmission' && (
                      <p className="text-sm mt-1">
                        Your role: {formatRoleName(getApprovalType())}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Not Authorized Section */}
          {!canApproveForm() && (
            <div className="mx-5 mb-6">
              <div className="bg-white rounded-md shadow-sm p-5">
                <div className="bg-yellow-50 p-4 rounded-md text-yellow-700 flex items-start">
                  <FiAlertTriangle className="mt-1 mr-3 flex-shrink-0 text-xl" />
                  <div>
                    <p className="font-semibold">You are not authorized to approve this form</p>
                    <p className="text-sm mt-1">
                      Your department: {user?.department}<br />
                      Required role: {getRequiredApproverRoles()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FormReviewPage;