import React, { useState, useEffect } from "react";
import { FiFileText, FiDownload, FiCheckCircle, FiXCircle, FiAlertTriangle } from "react-icons/fi";
import { useParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../utils/api";
import { Toaster } from 'react-hot-toast';

const DocumentReviewPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  
  const [document, setDocument] = useState(null);
  const [student, setStudent] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/documents/${id}`);
        setDocument(response.data);
        
        // Fetch student info
        if (response.data.owner) {
          try {
            const studentResponse = await api.get(`/users/profile/${response.data.owner}`);
            setStudent(studentResponse.data);
          } catch (err) {
            console.error("Failed to fetch student details:", err);
          }
        }
      } catch (err) {
        console.error("Error fetching document:", err);
        setError("Could not load document details. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocument();
  }, [id]);

  const handleApproveDocument = async () => {
    try {
      setSubmitting(true);
      setError(null);
      
      await api.put(`/documents/${id}/status`, {
        status: "approved",
        feedback
      });
      
      // Update local state
      setDocument(prev => ({
        ...prev,
        status: "approved",
        reviewDate: new Date().toISOString(),
        feedback
      }));
      
      setSuccessMessage("Document has been approved successfully.");
    } catch (err) {
      console.error("Error approving document:", err);
      setError("Could not approve document. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectDocument = async () => {
    if (!feedback.trim()) {
      setError("Please provide feedback explaining why the document is being rejected.");
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      await api.put(`/documents/${id}/status`, {
        status: "rejected",
        feedback
      });
      
      // Update local state
      setDocument(prev => ({
        ...prev,
        status: "rejected",
        reviewDate: new Date().toISOString(),
        feedback
      }));
      
      setSuccessMessage("Document has been rejected successfully.");
    } catch (err) {
      console.error("Error rejecting document:", err);
      setError("Could not reject document. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadDocument = async () => {
    try {
      setError(null);
      
      // Get the file using your API instance (which already includes auth headers)
      const response = await api.get(`/documents/download/${id}`, {
        responseType: 'blob' // Important for file downloads
      });
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      
      // Create a link element using window.document
      const link = window.document.createElement('a');
      link.href = url;
      link.setAttribute('download', document.fileName || 'document'); 
      
      // Append to document
      window.document.body.appendChild(link);
      
      // Trigger download
      link.click();
      
      // Clean up
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading document:", err);
      setError("Could not download document. Please try again later.");
    }
  };

  // Check if staff can approve this document type based on their department
  const canApprove = () => {
    if (!document || !user) return false;
    
    // Admin can approve anything
    if (user.role === 'admin') return true;
    
    const staffDepartment = user.department;
    const documentType = document.documentType;
    
    // Logic based on backend's canStaffApproveDocument function
    switch (documentType) {
      case 'Admission Letter':
        return staffDepartment === 'Registrar';
      case 'Birth Certificate':
      case 'Passport':
        return staffDepartment === 'Student Support';
      case 'Payment Receipt':
        return staffDepartment === 'Finance';
      case 'Medical Report':
        return staffDepartment === 'Health Services';
      case 'Transcript':
        return staffDepartment.includes('HOD');
      case 'JAMB Result':
      case 'JAMB Admission':
      case 'WAEC':
        // For school officers, they need to check if they manage the student's department
        if (user.managedDepartments && student) {
          return user.managedDepartments.includes(student.department);
        }
        return false;
      default:
        return false;
    }
  };

  return (
    <div
      style={{ backgroundColor: "#F6F6F6" }}
      className="w-full h-full overflow-auto"
    >
      <Toaster position="top-right" />
      <div className="text-2xl font-bold text-[#1E3A8A] mx-6 flex items-center">
        <FiFileText className="mr-2" />
        <h2 className="m-2">Document Review</h2>
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
          {document && (
            <span className={`px-3 py-1 rounded-full text-sm mr-2 ${
              document.status === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
                : document.status === 'approved'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {document.status === 'pending' 
                ? 'Pending Review' 
                : document.status === 'approved' 
                ? 'Approved' 
                : 'Rejected'}
            </span>
          )}
          {document && <h2 className="text-lg font-semibold">{document.documentType}</h2>}
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
      ) : !document ? (
        <div className="mx-5 bg-white rounded-lg shadow-sm p-8 text-center">
          <FiAlertTriangle className="mx-auto text-5xl text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Document Not Found</h2>
          <p className="text-gray-600 mb-4">
            The document you are looking for could not be found.
          </p>
          <button 
            onClick={() => window.history.back()}
            className="bg-[#1E3A8A] text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Documents
          </button>
        </div>
      ) : (
        <>
          {/* Document Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-5 mb-6">
            {/* Document Details */}
            <div className="bg-white rounded-md shadow-sm p-5">
              <h3 className="text-lg font-medium text-[#1E3A8A] mb-4">Document Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Title</p>
                  <p className="font-medium">{document.title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">File Name</p>
                  <p className="font-medium">{document.fileName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">File Size</p>
                  <p className="font-medium">{formatFileSize(document.fileSize)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Document Type</p>
                  <p className="font-medium">{document.documentType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Upload Date</p>
                  <p className="font-medium">{new Date(document.createdAt).toLocaleString()}</p>
                </div>
                {document.blockchainTxHash && (
                  <div>
                    <p className="text-sm text-gray-600">Blockchain Verified</p>
                    <p className="font-medium text-green-600">Yes</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Student Information */}
            <div className="bg-white rounded-md shadow-sm p-5">
              <h3 className="text-lg font-medium text-[#1E3A8A] mb-4">Student Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Student Name</p>
                  <p className="font-medium">{student?.fullName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Application ID</p>
                  <p className="font-medium">{student?.applicationId || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Department</p>
                  <p className="font-medium">{student?.department || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{student?.email || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Description and Preview */}
          <div className="mx-5 space-y-4 mb-6">
            {/* Document Description */}
            <div className="bg-white rounded-md shadow-sm p-5">
              <h3 className="text-lg font-medium text-[#1E3A8A] mb-4">Document Description</h3>
              <p className="text-gray-700">{document.description || 'No description provided.'}</p>
            </div>
            
            {/* Document Preview */}
            <div className="bg-white rounded-md shadow-sm p-5">
              <h3 className="text-lg font-medium text-[#1E3A8A] mb-4">Document Preview</h3>
              <div className="bg-gray-50 p-6 rounded-md flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
                <FiFileText className="text-gray-400 text-6xl mb-4" />
                <p className="text-gray-600 mb-4">Preview not available</p>
                <button
                  onClick={handleDownloadDocument}
                  className="flex items-center bg-[#1E3A8A] text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  <FiDownload className="mr-2" /> Download to View
                </button>
              </div>
            </div>
          </div>
          
          {/* Review Decision Section */}
          {document.status === 'pending' && canApprove() && (
            <div className="mx-5 mb-6">
              <div className="bg-white rounded-md shadow-sm p-5">
                <h3 className="text-lg font-medium text-[#1E3A8A] mb-4">Review Decision</h3>
                
                <div className="mb-4">
                  <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-1">
                    Feedback / Comments
                  </label>
                  <textarea
                    id="feedback"
                    rows="4"
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                    placeholder="Enter feedback for the student (required for rejection)"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  ></textarea>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleApproveDocument}
                    disabled={submitting}
                    className="flex items-center justify-center bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                  >
                    <FiCheckCircle className="mr-2" /> {submitting ? "Processing..." : "Approve Document"}
                  </button>
                  <button
                    onClick={handleRejectDocument}
                    disabled={submitting}
                    className="flex items-center justify-center bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                  >
                    <FiXCircle className="mr-2" /> {submitting ? "Processing..." : "Reject Document"}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Cannot Approve Section */}
          {document.status === 'pending' && !canApprove() && (
            <div className="mx-5 mb-6">
              <div className="bg-white rounded-md shadow-sm p-5">
                <div className="bg-yellow-50 p-4 rounded-md text-yellow-700 flex items-start">
                  <FiAlertTriangle className="mt-1 mr-3" />
                  <div>
                    <p className="font-semibold">You don't have permission to approve this document type</p>
                    <p className="text-sm">
                      The document type "{document.documentType}" must be reviewed by staff from the appropriate department.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Approved Status Info */}
          {document.status === 'approved' && (
            <div className="mx-5 mb-6">
              <div className="bg-white rounded-md shadow-sm p-5">
                <div className="bg-green-50 p-4 rounded-md text-green-700 flex items-start">
                  <FiCheckCircle className="mt-1 mr-3" />
                  <div>
                    <p className="font-semibold">This document has been approved</p>
                    <p className="text-sm">
                      Approved on {new Date(document.reviewDate).toLocaleString()} 
                      {document.reviewedBy ? ` by ${document.reviewedBy}` : ''}
                    </p>
                    {document.feedback && (
                      <div className="mt-2">
                        <p className="font-semibold text-sm">Feedback:</p>
                        <p className="text-sm">{document.feedback}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Rejected Status Info */}
          {document.status === 'rejected' && (
            <div className="mx-5 mb-6">
              <div className="bg-white rounded-md shadow-sm p-5">
                <div className="bg-red-50 p-4 rounded-md text-red-700 flex items-start">
                  <FiXCircle className="mt-1 mr-3" />
                  <div>
                    <p className="font-semibold">This document has been rejected</p>
                    <p className="text-sm">
                      Rejected on {new Date(document.reviewDate).toLocaleString()}
                      {document.reviewedBy ? ` by ${document.reviewedBy}` : ''}
                    </p>
                    {document.feedback && (
                      <div className="mt-2">
                        <p className="font-semibold text-sm">Reason for rejection:</p>
                        <p className="text-sm">{document.feedback}</p>
                      </div>
                    )}
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

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (!bytes) return 'Unknown';
  
  if (bytes < 1024) {
    return bytes + ' bytes';
  } else if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(2) + ' KB';
  } else {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }
};

export default DocumentReviewPage;