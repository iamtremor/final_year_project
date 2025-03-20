import React, { useState, useEffect } from "react";
import { FiFileText, FiDownload, FiCheckCircle, FiXCircle } from "react-icons/fi";
import { useParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../utils/api";

const DocumentReviewPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  
  const [document, setDocument] = useState(null);
  const [student, setStudent] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);
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
        setLoading(false);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full p-8">
        <div className="animate-pulse text-lg">Loading document...</div>
      </div>
    );
  }

  if (error && !document) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-600 m-4">
        <p className="font-semibold">Error</p>
        <p>{error}</p>
        <button 
          onClick={() => window.history.back()}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Back to Pending Approvals
        </button>
      </div>
    );
  }

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
    <div className="p-6 max-w-6xl mx-auto">
      {successMessage && (
        <div className="bg-green-50 p-4 rounded-md text-green-600 mb-6">
          <p className="font-semibold">{successMessage}</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 p-4 rounded-md text-red-600 mb-6">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Document Review</h1>
        <button
          onClick={() => window.history.back()}
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
        >
          Back
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold">{document?.title}</h2>
              <p className="text-gray-600">{document?.documentType}</p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center">
              <span className={`px-3 py-1 rounded-full text-sm ${
                document?.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : document?.status === 'approved'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {document?.status === 'pending' 
                  ? 'Pending Review' 
                  : document?.status === 'approved' 
                  ? 'Approved' 
                  : 'Rejected'}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm uppercase text-gray-500 font-semibold mb-2">Document Details</h3>
              <div className="bg-gray-50 p-4 rounded">
                <div className="mb-3">
                  <p className="text-sm text-gray-600">File Name</p>
                  <p className="font-medium">{document?.fileName}</p>
                </div>
                <div className="mb-3">
                  <p className="text-sm text-gray-600">File Size</p>
                  <p className="font-medium">{formatFileSize(document?.fileSize)}</p>
                </div>
                <div className="mb-3">
                  <p className="text-sm text-gray-600">Document Type</p>
                  <p className="font-medium">{document?.documentType}</p>
                </div>
                <div className="mb-3">
                  <p className="text-sm text-gray-600">Upload Date</p>
                  <p className="font-medium">{new Date(document?.createdAt).toLocaleString()}</p>
                </div>
                {document?.blockchainTxHash && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600">Blockchain Verified</p>
                    <p className="font-medium text-green-600">Yes</p>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm uppercase text-gray-500 font-semibold mb-2">Student Information</h3>
              <div className="bg-gray-50 p-4 rounded">
                <div className="mb-3">
                  <p className="text-sm text-gray-600">Student Name</p>
                  <p className="font-medium">{student?.fullName || 'N/A'}</p>
                </div>
                <div className="mb-3">
                  <p className="text-sm text-gray-600">Application ID</p>
                  <p className="font-medium">{student?.applicationId || 'N/A'}</p>
                </div>
                <div className="mb-3">
                  <p className="text-sm text-gray-600">Department</p>
                  <p className="font-medium">{student?.department || 'N/A'}</p>
                </div>
                <div className="mb-3">
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{student?.email || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-sm uppercase text-gray-500 font-semibold mb-2">Document Description</h3>
            <div className="bg-gray-50 p-4 rounded">
              <p>{document?.description || 'No description provided.'}</p>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-sm uppercase text-gray-500 font-semibold mb-2">Document Preview</h3>
            <div className="bg-gray-50 p-6 rounded flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
              <FiFileText className="text-gray-400 text-6xl mb-4" />
              <p className="text-gray-600 mb-4">Preview not available</p>
              <button
                onClick={handleDownloadDocument}
                className="flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                <FiDownload className="mr-2" /> Download to View
              </button>
            </div>
          </div>
          
          {document?.status === 'pending' && canApprove() && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Review Decision</h3>
              
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
              
              <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
                <button
                  onClick={handleApproveDocument}
                  disabled={submitting}
                  className="flex items-center justify-center bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 disabled:bg-gray-400"
                >
                  <FiCheckCircle className="mr-2" /> Approve Document
                </button>
                <button
                  onClick={handleRejectDocument}
                  disabled={submitting}
                  className="flex items-center justify-center bg-red-600 text-white px-6 py-3 rounded hover:bg-red-700 disabled:bg-gray-400"
                >
                  <FiXCircle className="mr-2" /> Reject Document
                </button>
              </div>
            </div>
          )}
          
          {document?.status === 'pending' && !canApprove() && (
            <div className="border-t pt-6">
              <div className="bg-yellow-50 p-4 rounded-md text-yellow-700 flex items-start">
                <FiXCircle className="mt-1 mr-3" />
                <div>
                  <p className="font-semibold">You don't have permission to approve this document type</p>
                  <p className="text-sm">
                    The document type "{document?.documentType}" must be reviewed by staff from the appropriate department.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {document?.status === 'approved' && (
            <div className="border-t pt-6">
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
          )}
          
          {document?.status === 'rejected' && (
            <div className="border-t pt-6">
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
          )}
        </div>
      </div>
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