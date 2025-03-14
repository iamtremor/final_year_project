import React, { useState, useEffect } from "react";
import { 
  FiFileText, 
  FiCheckCircle, 
  FiAlertTriangle, 
  FiClock, 
  FiLock, 
  FiUnlock 
} from "react-icons/fi";
import axios from "axios";
import { Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

const FormsStatus = () => {
  const [formsStatus, setFormsStatus] = useState({
    newClearance: {
      submitted: false,
      deputyRegistrarApproved: false,
      schoolOfficerApproved: false,
      approved: false,
      data: null
    },
    provAdmission: {
      submitted: false,
      approved: false,
      data: null,
      canSubmit: false
    },
    personalRecord: {
      submitted: false,
      approved: false,
      data: null,
      canSubmit: false
    },
    personalRecord2: {
      submitted: false,
      approved: false,
      data: null,
      canSubmit: false
    },
    affidavit: {
      submitted: false,
      approved: false,
      data: null,
      canSubmit: false
    }
  });
  const [loading, setLoading] = useState(true);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  useEffect(() => {
    fetchFormsStatus();
  }, []);

  const fetchFormsStatus = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get('/api/clearance/forms', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data) {
        setFormsStatus(response.data);
        
        // Calculate completion percentage
        calculateCompletionPercentage(response.data);
      }
    } catch (error) {
      console.error('Error fetching forms status:', error);
      toast.error('Failed to load forms status');
    } finally {
      setLoading(false);
    }
  };

  const calculateCompletionPercentage = (status) => {
    // Count total forms and submitted/approved forms
    const totalForms = 5;
    
    let submittedCount = 0;
    let approvedCount = 0;
    
    // Check each form
    if (status.newClearance.submitted) submittedCount++;
    if (status.provAdmission.submitted) submittedCount++;
    if (status.personalRecord.submitted) submittedCount++;
    if (status.personalRecord2.submitted) submittedCount++;
    if (status.affidavit.submitted) submittedCount++;
    
    if (status.newClearance.approved) approvedCount++;
    if (status.provAdmission.approved) approvedCount++;
    if (status.personalRecord.approved) approvedCount++;
    if (status.personalRecord2.approved) approvedCount++;
    if (status.affidavit.approved) approvedCount++;
    
    // Weight submissions and approvals (submissions = 40%, approvals = 60%)
    const submissionWeight = (submittedCount / totalForms) * 0.4;
    const approvalWeight = (approvedCount / totalForms) * 0.6;
    
    const percentage = Math.round((submissionWeight + approvalWeight) * 100);
    setCompletionPercentage(percentage);
  };

  return (
    <div className="p-6">
      <Toaster position="top-right" />
      
      <div className="flex items-center mb-6">
        <FiFileText className="text-2xl text-[#1E3A8A] mr-2" />
        <h2 className="text-2xl font-bold text-[#1E3A8A]">Forms Status</h2>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1E3A8A]"></div>
        </div>
      ) : (
        <>
          {/* Progress Summary */}
          <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Forms Completion Progress</h3>
            
            <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
              <div 
                className="bg-[#1E3A8A] h-4 rounded-full"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Progress: {completionPercentage}%</span>
              <span className="font-medium text-[#1E3A8A]">
                {completionPercentage < 100 ? "In Progress" : "Complete"}
              </span>
            </div>
            
            <div className="mt-4 bg-blue-50 p-3 rounded text-sm text-blue-800 flex items-start">
              <FiInfo className="flex-shrink-0 text-blue-500 mt-0.5 mr-2" />
              <p>
                Your forms clearance process consists of 5 forms. You must start with the New Clearance Form, which requires approval by the Deputy Registrar and School Officer before you can access the remaining forms.
              </p>
            </div>
          </div>
          
          {/* Forms List */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-200">
              {/* New Clearance Form */}
              <div className="p-5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      formsStatus.newClearance.approved ? "bg-green-100 text-green-600" :
                      formsStatus.newClearance.submitted ? "bg-yellow-100 text-yellow-600" :
                      "bg-blue-100 text-blue-600"
                    }`}>
                      <FiFileText className="h-5 w-5" />
                    </div>
                    
                    <div className="ml-4">
                      <h4 className="text-lg font-medium text-gray-900">New Clearance Form</h4>
                      <div className="flex items-center mt-1">
                        {formsStatus.newClearance.approved ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <FiCheckCircle className="mr-1" /> Fully Approved
                          </span>
                        ) : formsStatus.newClearance.deputyRegistrarApproved ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <FiClock className="mr-1" /> Waiting for School Officer
                          </span>
                        ) : formsStatus.newClearance.submitted ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <FiClock className="mr-1" /> Waiting for Deputy Registrar
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Not Submitted
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Link 
                    to="/student/forms/new-clearance"
                    className="px-4 py-2 bg-[#1E3A8A] text-white rounded hover:bg-[#152a63]"
                  >
                    {formsStatus.newClearance.submitted ? "View" : "Fill Form"}
                  </Link>
                </div>
                
                {formsStatus.newClearance.submitted && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-md">
                      <h5 className="text-sm font-medium text-gray-700">Deputy Registrar Approval</h5>
                      <div className="flex items-center mt-1">
                        {formsStatus.newClearance.deputyRegistrarApproved ? (
                          <span className="inline-flex items-center text-green-600">
                            <FiCheckCircle className="mr-1" /> Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-yellow-600">
                            <FiClock className="mr-1" /> Pending
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-md">
                      <h5 className="text-sm font-medium text-gray-700">School Officer Approval</h5>
                      <div className="flex items-center mt-1">
                        {formsStatus.newClearance.schoolOfficerApproved ? (
                          <span className="inline-flex items-center text-green-600">
                            <FiCheckCircle className="mr-1" /> Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-yellow-600">
                            <FiClock className="mr-1" /> Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Provisional Admission Form */}
              <div className="p-5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      !formsStatus.newClearance.approved ? "bg-gray-100 text-gray-400" :
                      formsStatus.provAdmission.approved ? "bg-green-100 text-green-600" :
                      formsStatus.provAdmission.submitted ? "bg-yellow-100 text-yellow-600" :
                      "bg-blue-100 text-blue-600"
                    }`}>
                      <FiFileText className="h-5 w-5" />
                    </div>
                    
                    <div className="ml-4">
                      <h4 className="text-lg font-medium text-gray-900">Provisional Admission Form</h4>
                      <div className="flex items-center mt-1">
                        {!formsStatus.newClearance.approved ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <FiLock className="mr-1" /> Locked
                          </span>
                        ) : formsStatus.provAdmission.approved ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <FiCheckCircle className="mr-1" /> Approved
                          </span>
                        ) : formsStatus.provAdmission.submitted ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <FiClock className="mr-1" /> Pending Approval
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <FiUnlock className="mr-1" /> Available
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {formsStatus.newClearance.approved ? (
                    <Link 
                      to="/student/forms/prov-admission"
                      className="px-4 py-2 bg-[#1E3A8A] text-white rounded hover:bg-[#152a63]"
                    >
                      {formsStatus.provAdmission.submitted ? "View" : "Fill Form"}
                    </Link>
                  ) : (
                    <button 
                      className="px-4 py-2 bg-gray-300 text-gray-600 rounded cursor-not-allowed"
                      disabled
                    >
                      Locked
                    </button>
                  )}
                </div>
              </div>
              
              {/* Personal Record Form */}
              <div className="p-5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      !formsStatus.newClearance.approved ? "bg-gray-100 text-gray-400" :
                      formsStatus.personalRecord.approved ? "bg-green-100 text-green-600" :
                      formsStatus.personalRecord.submitted ? "bg-yellow-100 text-yellow-600" :
                      "bg-blue-100 text-blue-600"
                    }`}>
                      <FiFileText className="h-5 w-5" />
                    </div>
                    
                    <div className="ml-4">
                      <h4 className="text-lg font-medium text-gray-900">Personal Record Form</h4>
                      <div className="flex items-center mt-1">
                        {!formsStatus.newClearance.approved ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <FiLock className="mr-1" /> Locked
                          </span>
                        ) : formsStatus.personalRecord.approved ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <FiCheckCircle className="mr-1" /> Approved
                          </span>
                        ) : formsStatus.personalRecord.submitted ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <FiClock className="mr-1" /> Pending Approval
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <FiUnlock className="mr-1" /> Available
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {formsStatus.newClearance.approved ? (
                    <Link 
                      to="/student/forms/personal-record"
                      className="px-4 py-2 bg-[#1E3A8A] text-white rounded hover:bg-[#152a63]"
                    >
                      {formsStatus.personalRecord.submitted ? "View" : "Fill Form"}
                    </Link>
                  ) : (
                    <button 
                      className="px-4 py-2 bg-gray-300 text-gray-600 rounded cursor-not-allowed"
                      disabled
                    >
                      Locked
                    </button>
                  )}
                </div>
              </div>
              
              {/* Personal Record 2 Form */}
              <div className="p-5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      !formsStatus.newClearance.approved ? "bg-gray-100 text-gray-400" :
                      formsStatus.personalRecord2.approved ? "bg-green-100 text-green-600" :
                      formsStatus.personalRecord2.submitted ? "bg-yellow-100 text-yellow-600" :
                      "bg-blue-100 text-blue-600"
                    }`}>
                      <FiFileText className="h-5 w-5" />
                    </div>
                    
                    <div className="ml-4">
                      <h4 className="text-lg font-medium text-gray-900">Personal Record 2 Form</h4>
                      <div className="flex items-center mt-1">
                        {!formsStatus.newClearance.approved ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <FiLock className="mr-1" /> Locked
                          </span>
                        ) : formsStatus.personalRecord2.approved ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <FiCheckCircle className="mr-1" /> Approved
                          </span>
                        ) : formsStatus.personalRecord2.submitted ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <FiClock className="mr-1" /> Pending Approval
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <FiUnlock className="mr-1" /> Available
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {formsStatus.newClearance.approved ? (
                    <Link 
                      to="/student/forms/personal-record2"
                      className="px-4 py-2 bg-[#1E3A8A] text-white rounded hover:bg-[#152a63]"
                    >
                      {formsStatus.personalRecord2.submitted ? "View" : "Fill Form"}
                    </Link>
                  ) : (
                    <button 
                      className="px-4 py-2 bg-gray-300 text-gray-600 rounded cursor-not-allowed"
                      disabled
                    >
                      Locked
                    </button>
                  )}
                </div>
              </div>
              
              {/* Rules & Affidavit Form */}
              <div className="p-5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      !formsStatus.newClearance.approved ? "bg-gray-100 text-gray-400" :
                      formsStatus.affidavit.approved ? "bg-green-100 text-green-600" :
                      formsStatus.affidavit.submitted ? "bg-yellow-100 text-yellow-600" :
                      "bg-blue-100 text-blue-600"
                    }`}>
                      <FiFileText className="h-5 w-5" />
                    </div>
                    
                    <div className="ml-4">
                      <h4 className="text-lg font-medium text-gray-900">Rules & Affidavit Form</h4>
                      <div className="flex items-center mt-1">
                        {!formsStatus.newClearance.approved ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <FiLock className="mr-1" /> Locked
                          </span>
                        ) : formsStatus.affidavit.approved ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <FiCheckCircle className="mr-1" /> Approved
                          </span>
                        ) : formsStatus.affidavit.submitted ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <FiClock className="mr-1" /> Pending Approval
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <FiUnlock className="mr-1" /> Available
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {formsStatus.newClearance.approved ? (
                    <Link 
                      to="/student/forms/affidavit"
                      className="px-4 py-2 bg-[#1E3A8A] text-white rounded hover:bg-[#152a63]"
                    >
                      {formsStatus.affidavit.submitted ? "View" : "Fill Form"}
                    </Link>
                  ) : (
                    <button 
                      className="px-4 py-2 bg-gray-300 text-gray-600 rounded cursor-not-allowed"
                      disabled
                    >
                      Locked
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FormsStatus;
