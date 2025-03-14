// src/components/Students/Dashboard/ClearanceForm/ClearanceForm.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FiFileText, 
  FiCheckCircle, 
  FiClock, 
  FiAlertCircle, 
  FiUpload,
  FiEdit,
  FiLock,
  FiUnlock,
  FiFilePlus
} from "react-icons/fi";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../../../../context/AuthContext";
import NewClearanceForm from "./NewClearanceForm";
import ProvAdmissionForm from "./ProvAdmissionForm";
import PersonalRecord from "./PersonalRecord";
import PersonalRecord2 from "./PersonalRecord2";
import AffidavitForm from "./AffidavitForm";
import DocumentUploader from "./DocumentUploader";

const ClearanceForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('newClearance');
  const [loading, setLoading] = useState(true);
  const [formStatus, setFormStatus] = useState({
    newClearance: { submitted: false, approved: false, data: null },
    provAdmission: { submitted: false, approved: false, locked: true, data: null },
    personalRecord: { submitted: false, approved: false, locked: true, data: null },
    personalRecord2: { submitted: false, approved: false, locked: true, data: null },
    affidavit: { submitted: false, approved: false, locked: true, data: null }
  });
  const [documentStatus, setDocumentStatus] = useState({
    admissionLetter: { uploaded: false, approved: false },
    jambResult: { uploaded: false, approved: false },
    jambAdmission: { uploaded: false, approved: false },
    waecResult: { uploaded: false, approved: false },
    birthCertificate: { uploaded: false, approved: false },
    paymentReceipt: { uploaded: false, approved: false },
    medicalReport: { uploaded: false, approved: false },
    passport: { uploaded: false, approved: false },
    transcript: { uploaded: false, approved: false }
  });
  const [documentsEnabled, setDocumentsEnabled] = useState(false);

  useEffect(() => {
    fetchFormsStatus();
    fetchDocumentsStatus();
  }, []);

  const fetchFormsStatus = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Get all forms status from the server
      const response = await axios.get('/api/clearance/forms', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data) {
        setFormStatus(response.data);
        
        // If the new clearance form is approved, enable the other forms
        if (response.data.newClearance.approved) {
          setFormStatus(prev => ({
            ...prev,
            provAdmission: { ...prev.provAdmission, locked: false },
            personalRecord: { ...prev.personalRecord, locked: false },
            personalRecord2: { ...prev.personalRecord2, locked: false },
            affidavit: { ...prev.affidavit, locked: false }
          }));
          
          // Also enable document uploads
          setDocumentsEnabled(true);
        }
      }
    } catch (error) {
      console.error('Error fetching forms status:', error);
      toast.error('Failed to load form status');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocumentsStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Get all documents for the student
      const response = await axios.get('/api/documents/student', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data && response.data.length > 0) {
        // Create an updated status object
        const updatedStatus = { ...documentStatus };
        
        // Process each document
        response.data.forEach(doc => {
          // Map document type to our internal keys
          const docTypeMap = {
            'Admission Letter': 'admissionLetter',
            'JAMB Result': 'jambResult',
            'JAMB Admission': 'jambAdmission',
            'WAEC': 'waecResult',
            'Birth Certificate': 'birthCertificate',
            'Payment Receipt': 'paymentReceipt',
            'Medical Report': 'medicalReport',
            'Passport': 'passport',
            'Transcript': 'transcript'
          };
          
          const docKey = docTypeMap[doc.documentType];
          if (docKey && updatedStatus[docKey]) {
            updatedStatus[docKey] = {
              uploaded: true,
              approved: doc.status === 'approved'
            };
          }
        });
        
        setDocumentStatus(updatedStatus);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load document status');
    }
  };

  const submitNewClearanceForm = async (formData) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post('/api/clearance/forms/new-clearance', formData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data) {
        setFormStatus(prev => ({
          ...prev,
          newClearance: {
            ...prev.newClearance,
            submitted: true,
            data: formData
          }
        }));
        
        toast.success('New clearance form submitted successfully');
        return true;
      }
    } catch (error) {
      console.error('Error submitting new clearance form:', error);
      toast.error(error.response?.data?.message || 'Failed to submit form');
      return false;
    }
  };

  const submitProvAdmissionForm = async (formData) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post('/api/clearance/forms/prov-admission', formData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data) {
        setFormStatus(prev => ({
          ...prev,
          provAdmission: {
            ...prev.provAdmission,
            submitted: true,
            data: formData
          }
        }));
        
        toast.success('Provisional admission form submitted successfully');
        return true;
      }
    } catch (error) {
      console.error('Error submitting provisional admission form:', error);
      toast.error(error.response?.data?.message || 'Failed to submit form');
      return false;
    }
  };

  const submitPersonalRecordForm = async (formData) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post('/api/clearance/forms/personal-record', formData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data) {
        setFormStatus(prev => ({
          ...prev,
          personalRecord: {
            ...prev.personalRecord,
            submitted: true,
            data: formData
          }
        }));
        
        toast.success('Personal record form submitted successfully');
        return true;
      }
    } catch (error) {
      console.error('Error submitting personal record form:', error);
      toast.error(error.response?.data?.message || 'Failed to submit form');
      return false;
    }
  };

  const submitPersonalRecord2Form = async (formData) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post('/api/clearance/forms/personal-record2', formData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data) {
        setFormStatus(prev => ({
          ...prev,
          personalRecord2: {
            ...prev.personalRecord2,
            submitted: true,
            data: formData
          }
        }));
        
        toast.success('Personal record 2 form submitted successfully');
        return true;
      }
    } catch (error) {
      console.error('Error submitting personal record 2 form:', error);
      toast.error(error.response?.data?.message || 'Failed to submit form');
      return false;
    }
  };

  const submitAffidavitForm = async (formData) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post('/api/clearance/forms/affidavit', formData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data) {
        setFormStatus(prev => ({
          ...prev,
          affidavit: {
            ...prev.affidavit,
            submitted: true,
            data: formData
          }
        }));
        
        toast.success('Affidavit form submitted successfully');
        return true;
      }
    } catch (error) {
      console.error('Error submitting affidavit form:', error);
      toast.error(error.response?.data?.message || 'Failed to submit form');
      return false;
    }
  };

  // Get form status icon
  const getFormStatusIcon = (form) => {
    if (form.locked) {
      return <FiLock className="text-gray-500" />;
    } else if (form.approved) {
      return <FiCheckCircle className="text-green-500" />;
    } else if (form.submitted) {
      return <FiClock className="text-yellow-500" />;
    } else {
      return <FiEdit className="text-blue-500" />;
    }
  };

  // Get document status icon
  const getDocumentStatusIcon = (doc) => {
    if (doc.approved) {
      return <FiCheckCircle className="text-green-500" />;
    } else if (doc.uploaded) {
      return <FiClock className="text-yellow-500" />;
    } else {
      return <FiUpload className="text-blue-500" />;
    }
  };

  // Render active form based on tab
  const renderActiveForm = () => {
    switch(activeTab) {
      case 'newClearance':
        return (
          <NewClearanceForm 
            initialData={formStatus.newClearance.data}
            isSubmitted={formStatus.newClearance.submitted}
            isApproved={formStatus.newClearance.approved}
            onSubmit={submitNewClearanceForm}
          />
        );
      case 'provAdmission':
        return (
          <ProvAdmissionForm 
            initialData={formStatus.provAdmission.data}
            isSubmitted={formStatus.provAdmission.submitted}
            isApproved={formStatus.provAdmission.approved}
            isLocked={formStatus.provAdmission.locked}
            onSubmit={submitProvAdmissionForm}
          />
        );
      case 'personalRecord':
        return (
          <PersonalRecord 
            initialData={formStatus.personalRecord.data}
            isSubmitted={formStatus.personalRecord.submitted}
            isApproved={formStatus.personalRecord.approved}
            isLocked={formStatus.personalRecord.locked}
            onSubmit={submitPersonalRecordForm}
          />
        );
      case 'personalRecord2':
        return (
          <PersonalRecord2 
            initialData={formStatus.personalRecord2.data}
            isSubmitted={formStatus.personalRecord2.submitted}
            isApproved={formStatus.personalRecord2.approved}
            isLocked={formStatus.personalRecord2.locked}
            onSubmit={submitPersonalRecord2Form}
          />
        );
      case 'affidavit':
        return (
          <AffidavitForm 
            initialData={formStatus.affidavit.data}
            isSubmitted={formStatus.affidavit.submitted}
            isApproved={formStatus.affidavit.approved}
            isLocked={formStatus.affidavit.locked}
            onSubmit={submitAffidavitForm}
          />
        );
      case 'documents':
        return (
          <DocumentUploader 
            documentsEnabled={documentsEnabled}
            documentStatus={documentStatus}
            onStatusChange={fetchDocumentsStatus}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <Toaster position="top-right" />
      
      <div className="flex items-center mb-6">
        <FiFileText className="text-2xl text-[#1E3A8A] mr-2" />
        <h2 className="text-2xl font-bold text-[#1E3A8A]">Clearance Form Process</h2>
      </div>
      
      {/* Process Summary */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Clearance Process Overview</h3>
        <p className="text-gray-700 mb-4">
          This process replaces the physical file clearance workflow. You'll need to complete the following steps:
        </p>
        <ol className="list-decimal pl-5 mb-4 space-y-2">
          <li className="text-gray-700">Complete the <span className="font-medium">New Student Clearance Form</span> first</li>
          <li className="text-gray-700">After approval by the Deputy Registrar and School Officer, you'll gain access to upload required documents</li>
          <li className="text-gray-700">Complete the remaining forms: Provisional Admission, Personal Records, and Rules Affidavit</li>
          <li className="text-gray-700">Wait for final approval from all required signatories</li>
        </ol>
        
        <div className="mt-4 bg-blue-50 p-3 rounded border border-blue-200">
          <p className="text-sm text-blue-800 flex items-start">
            <FiAlertCircle className="text-blue-500 mt-0.5 mr-2" />
            The documents and forms must be approved by various university officers. You will be notified of any changes in approval status.
          </p>
        </div>
      </div>
      
      {/* Forms and Documents Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="md:col-span-1 bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Clearance Steps</h3>
          
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('newClearance')}
              className={`w-full flex items-center justify-between p-3 rounded-md text-left ${
                activeTab === 'newClearance' 
                  ? 'bg-blue-50 text-blue-700 font-medium' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mr-3 text-xs">1</span>
                <span>New Clearance Form</span>
              </div>
              {getFormStatusIcon(formStatus.newClearance)}
            </button>
            
            <button
              onClick={() => setActiveTab('provAdmission')}
              disabled={formStatus.provAdmission.locked}
              className={`w-full flex items-center justify-between p-3 rounded-md text-left ${
                activeTab === 'provAdmission' 
                  ? 'bg-blue-50 text-blue-700 font-medium' 
                  : formStatus.provAdmission.locked 
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mr-3 text-xs">2</span>
                <span>Provisional Admission</span>
              </div>
              {getFormStatusIcon(formStatus.provAdmission)}
            </button>
            
            <button
              onClick={() => setActiveTab('personalRecord')}
              disabled={formStatus.personalRecord.locked}
              className={`w-full flex items-center justify-between p-3 rounded-md text-left ${
                activeTab === 'personalRecord' 
                  ? 'bg-blue-50 text-blue-700 font-medium' 
                  : formStatus.personalRecord.locked 
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mr-3 text-xs">3</span>
                <span>Personal Record</span>
              </div>
              {getFormStatusIcon(formStatus.personalRecord)}
            </button>
            
            <button
              onClick={() => setActiveTab('personalRecord2')}
              disabled={formStatus.personalRecord2.locked}
              className={`w-full flex items-center justify-between p-3 rounded-md text-left ${
                activeTab === 'personalRecord2' 
                  ? 'bg-blue-50 text-blue-700 font-medium' 
                  : formStatus.personalRecord2.locked 
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mr-3 text-xs">4</span>
                <span>Personal Record 2</span>
              </div>
              {getFormStatusIcon(formStatus.personalRecord2)}
            </button>
            
            <button
              onClick={() => setActiveTab('affidavit')}
              disabled={formStatus.affidavit.locked}
              className={`w-full flex items-center justify-between p-3 rounded-md text-left ${
                activeTab === 'affidavit' 
                  ? 'bg-blue-50 text-blue-700 font-medium' 
                  : formStatus.affidavit.locked 
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mr-3 text-xs">5</span>
                <span>Rules & Affidavit</span>
              </div>
              {getFormStatusIcon(formStatus.affidavit)}
            </button>
            
            <div className="pt-4 mt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Required Documents</h4>
              
              <button
                onClick={() => setActiveTab('documents')}
                disabled={!documentsEnabled}
                className={`w-full flex items-center justify-between p-3 rounded-md text-left ${
                  activeTab === 'documents' 
                    ? 'bg-blue-50 text-blue-700 font-medium' 
                    : !documentsEnabled 
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <FiFilePlus className="mr-3 text-blue-600" />
                  <span>Required Documents</span>
                </div>
                {documentsEnabled ? (
                  <FiUnlock className="text-green-600" />
                ) : (
                  <FiLock className="text-gray-500" />
                )}
              </button>
            </div>
          </div>
          
          {/* Progress indicator */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Clearance Progress</h4>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ 
                  width: `${calculateProgress()}%` 
                }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-right">{calculateProgress()}% Complete</p>
          </div>
        </div>
        
        <div className="md:col-span-3 bg-white rounded-lg shadow-sm p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1E3A8A]"></div>
            </div>
          ) : (
            renderActiveForm()
          )}
        </div>
      </div>
    </div>
  );
  
  // Helper function to calculate overall completion progress
  function calculateProgress() {
    const formCount = 5; // Number of forms
    const documentCheck = documentsEnabled ? 1 : 0;
    
    let completedForms = 0;
    if (formStatus.newClearance.submitted) completedForms++;
    if (formStatus.provAdmission.submitted) completedForms++;
    if (formStatus.personalRecord.submitted) completedForms++;
    if (formStatus.personalRecord2.submitted) completedForms++;
    if (formStatus.affidavit.submitted) completedForms++;
    
    const documentProgress = Object.values(documentStatus).filter(doc => doc.uploaded).length;
    const totalDocuments = Object.keys(documentStatus).length;
    const documentWeight = documentCheck ? (documentProgress / totalDocuments) : 0;
    
    const totalProgress = ((completedForms / formCount) * 0.7) + (documentWeight * 0.3);
    return Math.round(totalProgress * 100);
  }
};

export default ClearanceForm;