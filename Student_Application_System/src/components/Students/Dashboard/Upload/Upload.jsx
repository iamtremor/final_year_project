import React, { useState, useEffect, useRef } from "react";
import { FiUpload, FiX, FiFile, FiPaperclip, FiInfo, FiCheck, FiAlertTriangle, FiPlus, FiTrash2, FiClock } from "react-icons/fi";
import { AiOutlineCloudUpload } from "react-icons/ai";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../../../../context/AuthContext";
import Draganddrop from "./Draganddrop";

const UploadDocuments = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isWithinDeadline, setIsWithinDeadline] = useState(true);
  const [documentUploads, setDocumentUploads] = useState([
    {
      id: Date.now(),
      documentName: "",
      documentType: "",
      description: "",
      file: null,
      status: "idle", // idle, uploading, success, error
      error: null,
      progress: 0
    }
  ]);
  const [activeTab, setActiveTab] = useState('upload'); // upload, history
  
  useEffect(() => {
    // Check if submission is within deadline when component mounts
    const checkDeadline = async () => {
      try {
        if (user?.applicationId) {
          const token = localStorage.getItem('token');
          const response = await axios.get(
            `/api/blockchain/applications/within-deadline/${user.applicationId}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );
          setIsWithinDeadline(response.data.isWithinDeadline);
          
          if (!response.data.isWithinDeadline) {
            toast.error('Submission deadline has passed');
          }
        }
      } catch (error) {
        console.error('Error checking deadline:', error);
      }
    };
    
    checkDeadline();
  }, [user]);

  // Handle input change for a specific document upload
  const handleInputChange = (id, field, value) => {
    setDocumentUploads(prevUploads => 
      prevUploads.map(upload => 
        upload.id === id ? { ...upload, [field]: value } : upload
      )
    );
  };

  // Handle file selection for a specific document upload
  const handleFileSelected = (id, files) => {
    if (files && files.length > 0) {
      setDocumentUploads(prevUploads => 
        prevUploads.map(upload => 
          upload.id === id ? { ...upload, file: files[0] } : upload
        )
      );
    }
  };

  // Add new document upload form
  const addNewDocumentUpload = () => {
    setDocumentUploads(prev => [
      ...prev, 
      {
        id: Date.now(),
        documentName: "",
        documentType: "",
        description: "",
        file: null,
        status: "idle",
        error: null,
        progress: 0
      }
    ]);
  };

  // Remove a document upload form
  const removeDocumentUpload = (id) => {
    if (documentUploads.length > 1) {
      setDocumentUploads(documentUploads.filter(upload => upload.id !== id));
    } else {
      toast.error("You must have at least one document to upload");
    }
  };

  // Handle form submission for all documents
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isWithinDeadline) {
      toast.error('Submission deadline has passed. Cannot upload documents.');
      return;
    }
    
    const incompleteUploads = documentUploads.filter(upload => 
      !upload.documentName || !upload.documentType || !upload.file
    );
    
    if (incompleteUploads.length > 0) {
      toast.error('Please complete all required fields for each document');
      return;
    }
    
    setIsLoading(true);
    
    // Create an array to track upload progress
    const uploadResults = [];
    
    // Process each document upload sequentially
    for (const [index, upload] of documentUploads.entries()) {
      try {
        // Update status to uploading
        setDocumentUploads(prevUploads => 
          prevUploads.map(u => 
            u.id === upload.id ? { ...u, status: "uploading", progress: 0 } : u
          )
        );
        
        // Create form data for API call
        const apiFormData = new FormData();
        apiFormData.append('file', upload.file);
        apiFormData.append('title', upload.documentName);
        apiFormData.append('description', upload.description || '');
        apiFormData.append('documentType', upload.documentType);
        
        // If the endpoint expects applicationId, append it
        if (user?.applicationId) {
          apiFormData.append('applicationId', user.applicationId);
        }
        
        const token = localStorage.getItem('token');
        
        // Upload progress handler
        const onUploadProgress = (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setDocumentUploads(prevUploads => 
            prevUploads.map(u => 
              u.id === upload.id ? { ...u, progress: percentCompleted } : u
            )
          );
        };
        
        // Try uploading to documents endpoint
        let response;
        try {
          response = await axios.post('/api/documents/upload', apiFormData, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            },
            onUploadProgress
          });
        } catch (docError) {
          console.log("Standard upload failed, trying blockchain endpoint...");
          // If that fails, try the blockchain endpoint
          response = await axios.post('/api/blockchain/documents/upload', apiFormData, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            },
            onUploadProgress
          });
        }
        
        // Update status to success
        setDocumentUploads(prevUploads => 
          prevUploads.map(u => 
            u.id === upload.id ? { ...u, status: "success", progress: 100 } : u
          )
        );
        
        uploadResults.push({
          id: upload.id,
          success: true,
          docName: upload.documentName
        });
        
      } catch (error) {
        console.error(`Upload error for document ${index + 1}:`, error);
        let errorMessage = 'Failed to upload document. Please try again.';
        
        if (error.response) {
          errorMessage = error.response.data?.message || errorMessage;
        }
        
        // Update status to error
        setDocumentUploads(prevUploads => 
          prevUploads.map(u => 
            u.id === upload.id ? { ...u, status: "error", error: errorMessage, progress: 0 } : u
          )
        );
        
        uploadResults.push({
          id: upload.id,
          success: false,
          docName: upload.documentName,
          error: errorMessage
        });
      }
    }
    
    setIsLoading(false);
    
    // Summarize results
    const successCount = uploadResults.filter(r => r.success).length;
    const failCount = uploadResults.filter(r => !r.success).length;
    
    if (successCount > 0 && failCount === 0) {
      toast.success(`Successfully uploaded ${successCount} document${successCount !== 1 ? 's' : ''}!`);
      
      // Reset the form with a single empty upload
      setDocumentUploads([
        {
          id: Date.now(),
          documentName: "",
          documentType: "",
          description: "",
          file: null,
          status: "idle",
          error: null,
          progress: 0
        }
      ]);
    } else if (successCount > 0 && failCount > 0) {
      toast.success(`Successfully uploaded ${successCount} document${successCount !== 1 ? 's' : ''}, but ${failCount} failed.`);
    } else {
      toast.error('Failed to upload documents. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'uploading': return 'bg-blue-500';
      default: return 'bg-gray-300';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Toaster position="top-right" />
      
      {/* Header with tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
        <div className="text-2xl font-bold text-[#1E3A8A] flex items-center mb-4 sm:mb-0">
          <AiOutlineCloudUpload className="mr-2" />
          <h2>Document Manager</h2>
        </div>
        
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button 
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'upload' 
                ? 'bg-white text-[#1E3A8A] shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Upload Documents
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'history' 
                ? 'bg-white text-[#1E3A8A] shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Upload History
          </button>
        </div>
      </div>
      
      {/* Deadline Warning */}
      {!isWithinDeadline && (
        <div className="mb-6 p-4 bg-white border-l-4 border-red-500 rounded-md shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Deadline passed</h3>
              <div className="mt-1 text-sm text-red-700">
                <p>You can no longer submit documents as the deadline has passed.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'upload' && (
        <div className="space-y-8">
          {/* Quick Info */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[#1E3A8A] mb-2">Upload Multiple Documents</h3>
            <p className="text-gray-600">
              You can now upload multiple documents at once. Add as many documents as needed and submit them all with a single click.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <div className="bg-white px-3 py-1 rounded-full text-xs font-medium text-blue-800 shadow-sm flex items-center">
                <FiCheck className="mr-1" /> Secured with blockchain
              </div>
              <div className="bg-white px-3 py-1 rounded-full text-xs font-medium text-blue-800 shadow-sm flex items-center">
                <FiCheck className="mr-1" /> Multiple document support
              </div>
              <div className="bg-white px-3 py-1 rounded-full text-xs font-medium text-blue-800 shadow-sm flex items-center">
                <FiCheck className="mr-1" /> Progress tracking
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {documentUploads.map((upload, index) => (
                <div 
                  key={upload.id} 
                  className={`bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-200 ${
                    upload.status === 'uploading' ? 'ring-2 ring-blue-200' : 
                    upload.status === 'success' ? 'ring-2 ring-green-200' :
                    upload.status === 'error' ? 'ring-2 ring-red-200' : ''
                  }`}
                >
                  {/* Status indicator progress bar at top */}
                  <div className="h-1 w-full bg-gray-100">
                    <div 
                      className={`h-full ${getStatusColor(upload.status)} transition-all duration-300`}
                      style={{ width: `${upload.status === 'success' ? 100 : upload.progress}%` }}
                    ></div>
                  </div>
                  
                  <div className="p-6">
                    {/* Document Form Header */}
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          upload.status === 'success' ? 'bg-green-100 text-green-600' :
                          upload.status === 'error' ? 'bg-red-100 text-red-600' :
                          upload.status === 'uploading' ? 'bg-blue-100 text-blue-600' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {upload.status === 'success' ? <FiCheck /> :
                           upload.status === 'error' ? <FiX /> :
                           upload.status === 'uploading' ? <FiClock /> :
                           index + 1}
                        </div>
                        <h3 className="ml-3 font-medium text-gray-900">{
                          upload.documentName ? upload.documentName : `Document ${index + 1}`
                        }</h3>
                        
                        {upload.status === 'success' && (
                          <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Uploaded
                          </span>
                        )}
                        {upload.status === 'error' && (
                          <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Failed
                          </span>
                        )}
                        {upload.status === 'uploading' && (
                          <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {upload.progress}% Uploading...
                          </span>
                        )}
                      </div>
                      
                      {documentUploads.length > 1 && (
                        <button 
                          type="button"
                          onClick={() => removeDocumentUpload(upload.id)}
                          className="text-gray-400 hover:text-red-500 focus:outline-none"
                          disabled={upload.status === 'uploading'}
                        >
                          <FiTrash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-5">
                        {/* Document Name Input */}
                        <div>
                          <label
                            htmlFor={`documentName-${upload.id}`}
                            className="block text-sm font-medium text-gray-700"
                          >
                            Document Name *
                          </label>
                          <div className="mt-1">
                            <input
                              type="text"
                              id={`documentName-${upload.id}`}
                              value={upload.documentName}
                              onChange={(e) => handleInputChange(upload.id, "documentName", e.target.value)}
                              placeholder="Enter Document Name"
                              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                              required
                              disabled={upload.status === "success" || upload.status === "uploading"}
                            />
                          </div>
                        </div>

                        {/* Document Type Dropdown */}
                        <div>
                          <label
                            htmlFor={`documentType-${upload.id}`}
                            className="block text-sm font-medium text-gray-700"
                          >
                            Document Type *
                          </label>
                          <div className="mt-1">
                            <select
                              id={`documentType-${upload.id}`}
                              value={upload.documentType}
                              onChange={(e) => handleInputChange(upload.id, "documentType", e.target.value)}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                              required
                              disabled={upload.status === "success" || upload.status === "uploading"}
                            >
                              <option value="">Select Document Type</option>
                              <option value="SSCE">SSCE Result</option>
                              <option value="JAMB">JAMB Result</option>
                              <option value="Transcript">Transcript</option>
                              <option value="Admission Letter">Admission Letter</option>
                              <option value="Medical Report">Medical Report</option>
                              <option value="Passport">Passport Photograph</option>
                              <option value="NIN">National ID (NIN)</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                        </div>
                        
                        {/* Description Field */}
                        <div>
                          <label
                            htmlFor={`description-${upload.id}`}
                            className="block text-sm font-medium text-gray-700"
                          >
                            Description (Optional)
                          </label>
                          <div className="mt-1">
                            <textarea
                              id={`description-${upload.id}`}
                              value={upload.description}
                              onChange={(e) => handleInputChange(upload.id, "description", e.target.value)}
                              placeholder="Enter document description"
                              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                              rows="3"
                              disabled={upload.status === "success" || upload.status === "uploading"}
                            ></textarea>
                          </div>
                        </div>
                      </div>
                      
                      {/* File Upload Area */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Upload File *
                        </label>
                        
                        {upload.status !== "success" && upload.status !== "uploading" ? (
                          <div className="mt-1">
                            <Draganddrop 
                              onFilesSelected={(files) => handleFileSelected(upload.id, files)} 
                            />
                          </div>
                        ) : (
                          <div className={`mt-1 p-4 border ${upload.status === 'success' ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'} rounded-lg`}>
                            <div className="flex items-center">
                              <div className={`flex-shrink-0 ${upload.status === 'success' ? 'text-green-500' : 'text-blue-500'}`}>
                                <FiFile className="h-5 w-5" />
                              </div>
                              <div className="ml-3 flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {upload.file.name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {(upload.file.size / 1024).toFixed(2)} KB
                                </p>
                              </div>
                              <div className="flex-shrink-0">
                                {upload.status === 'success' ? (
                                  <FiCheck className="h-5 w-5 text-green-500" />
                                ) : (
                                  <div className="animate-pulse">
                                    <div className="h-5 w-5 bg-blue-500 rounded-full opacity-75"></div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {upload.file && upload.status === "idle" && (
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <FiPaperclip className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            <span className="truncate">{upload.file.name}</span>
                          </div>
                        )}
                        
                        {upload.status === "error" && (
                          <div className="mt-2 flex items-center text-sm text-red-600">
                            <FiAlertTriangle className="flex-shrink-0 mr-1.5 h-4 w-4" />
                            <span>{upload.error}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Add More Button */}
            <button
              type="button"
              onClick={addNewDocumentUpload}
              disabled={isLoading || !isWithinDeadline}
              className={`w-full flex items-center justify-center px-4 py-3 border-2 border-dashed rounded-xl text-sm font-medium ${
                isLoading || !isWithinDeadline 
                  ? 'border-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'border-blue-200 text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              <FiPlus className="mr-2 h-5 w-5" aria-hidden="true" />
              Add Another Document
            </button>
            
            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading || !isWithinDeadline}
                className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm ${
                  isLoading || !isWithinDeadline 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-[#1E3A8A] text-white hover:bg-[#152a63] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E3A8A]'
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing Uploads...
                  </>
                ) : (
                  <>
                    <FiUpload className="mr-2 -ml-1 h-5 w-5" aria-hidden="true" />
                    Upload All Documents
                  </>
                )}
              </button>
            </div>
          </form>
          
          {/* Blockchain Info Card */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-50 rounded-md p-3">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5">
                  <h3 className="text-sm font-medium text-gray-900">Document Security Information</h3>
                  <div className="mt-1 text-sm text-gray-500">
                    <p>Your documents will be securely hashed and recorded on the blockchain to ensure their integrity and prevent unauthorized modifications.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <FiClock className="h-12 w-12" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No upload history</h3>
            <p className="mt-1 text-sm text-gray-500">
              Your document upload history will appear here
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#1E3A8A] hover:bg-[#152a63] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E3A8A]"
              >
                <FiUpload className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Upload Documents
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadDocuments;