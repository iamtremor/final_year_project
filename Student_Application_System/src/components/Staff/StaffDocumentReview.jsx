import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { 
  FaArrowLeft, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaFileAlt,
  FaDownload,
  FaEye,
  FaUser,
  FaCalendarAlt
} from "react-icons/fa";
import { FiAlertTriangle } from "react-icons/fi";

const DocumentReviewPage = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fileUrl, setFileUrl] = useState(null);
  const [viewMode, setViewMode] = useState('preview'); // 'preview' or 'info'

  // Fetch document data
  useEffect(() => {
    const fetchDocumentData = async () => {
      try {
        setLoading(true);
        
        // Fetch the specific document by ID
        const response = await axios.get(`/api/documents/${documentId}`);
        setDocument(response.data);
        
        // Create blob URL for file preview if possible
        const fileBlob = await fetchDocumentFile();
        if (fileBlob) {
          setFileUrl(URL.createObjectURL(fileBlob));
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching document data:', error);
        setError('Failed to load document data. Please try again later.');
        setLoading(false);
      }
    };

    if (documentId) {
      fetchDocumentData();
    }
    
    // Cleanup the created blob URL when component unmounts
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [documentId]);

  // Function to fetch the document file as blob
  const fetchDocumentFile = async () => {
    try {
      const response = await axios.get(`/api/documents/download/${documentId}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching document file:', error);
      return null;
    }
  };

  // Handle document approval
  const handleApprove = async () => {
    try {
      setSubmitting(true);
      
      // Submit document approval
      await axios.put(`/api/documents/${documentId}/status`, {
        status: 'approved',
        feedback
      });
      
      setSuccess(true);
      
      // After successful approval, wait 2 seconds and redirect back to dashboard
      setTimeout(() => {
        navigate('/staff/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error approving document:', error);
      setError('Failed to approve document. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle document rejection
  const handleReject = async () => {
    try {
      setSubmitting(true);
      
      if (!feedback) {
        setError('Please provide a reason for rejection');
        setSubmitting(false);
        return;
      }
      
      // Submit document rejection
      await axios.put(`/api/documents/${documentId}/status`, {
        status: 'rejected',
        feedback
      });
      
      setSuccess(true);
      
      // After successful rejection, wait 2 seconds and redirect back to dashboard
      setTimeout(() => {
        navigate('/staff/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error rejecting document:', error);
      setError('Failed to reject document. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle download button click
  const handleDownload = async () => {
    try {
      const response = await axios.get(`/api/documents/download/${documentId}`, {
        responseType: 'blob'
      });
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', document?.fileName || 'document');
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      setError('Failed to download document. Please try again later.');
    }
  };

  // Determine if current staff can approve this document
  const canApproveDocument = () => {
    if (!user || !document) return false;
    
    // Check if document is already approved or rejected
    if (document.status !== 'pending') return false;
    
    // Logic to check if staff can approve based on document type and staff department
    switch (document.documentType) {
      case 'JAMB Result':
      case 'JAMB Admission':
      case 'WAEC':
        // School officers can approve these
        return !document.owner?.department || user.department === document.owner.department;
      
      case 'Admission Letter':
        return user.department === 'Registrar';
      
      case 'Birth Certificate':
      case 'Passport':
        return user.department === 'Student Support';
      
      case 'Payment Receipt':
        return user.department === 'Finance';
      
      case 'Medical Report':
        return user.department === 'Health Services';
      
      case 'Transcript':
        return user.department && user.department.includes('HOD');
      
      default:
        // Admins can approve anything
        return user.role === 'admin';
    }
  };

  // Render the document preview based on file type
  const renderDocumentPreview = () => {
    if (!fileUrl) {
      return (
        <div className="bg-gray-100 p-8 flex flex-col items-center justify-center rounded-md">
          <FiAlertTriangle size={48} className="text-yellow-500 mb-4" />
          <p className="text-gray-700 mb-2">Document preview is not available</p>
          <button
            onClick={handleDownload}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded flex items-center"
          >
            <FaDownload className="mr-2" />
            Download Document
          </button>
        </div>
      );
    }

    // Try to determine file type from fileName if available
    const fileType = document?.mimeType || 
                    (document?.fileName && document.fileName.split('.').pop().toLowerCase());
    
    // Render based on file type
    if (fileType && (fileType.includes('image') || ['jpg', 'jpeg', 'png', 'gif'].includes(fileType))) {
      return (
        <div className="bg-gray-100 p-4 rounded-md">
          <div className="flex justify-end mb-2">
            <button
              onClick={handleDownload}
              className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded flex items-center text-sm"
            >
              <FaDownload className="mr-1" />
              Download
            </button>
          </div>
          <img 
            src={fileUrl} 
            alt="Document Preview"
            className="max-w-full h-auto mx-auto border border-gray-300 rounded" 
          />
        </div>
      );
    } else if (fileType && (fileType.includes('pdf') || fileType === 'pdf')) {
      return (
        <div className="bg-gray-100 p-4 rounded-md">
          <div className="flex justify-end mb-2">
            <button
              onClick={handleDownload}
              className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded flex items-center text-sm"
            >
              <FaDownload className="mr-1" />
              Download
            </button>
          </div>
          <iframe
            src={fileUrl}
            title="PDF Document Viewer"
            className="w-full h-[600px] border border-gray-300 rounded"
          />
        </div>
      );
    } else {
      // For other file types, offer download
      return (
        <div className="bg-gray-100 p-8 flex flex-col items-center justify-center rounded-md">
          <FaFileAlt size={48} className="text-blue-500 mb-4" />
          <p className="text-gray-700 mb-2">This file type cannot be previewed</p>
          <p className="text-gray-500 mb-4">Filename: {document?.fileName || 'Unknown'}</p>
          <button
            onClick={handleDownload}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded flex items-center"
          >
            <FaDownload className="mr-2" />
            Download Document
          </button>
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
          <span className="block sm:inline">Document {feedback ? 'rejected' : 'approved'} successfully! Redirecting...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FaFileAlt size={24} className="text-[#1E3A8A] mr-2" />
          <h2 className="text-2xl font-bold text-[#1E3A8A]">Document Review</h2>
        </div>
        <button 
          onClick={() => navigate(-1)} 
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded flex items-center"
        >
          <FaArrowLeft className="mr-2" />
          Back
        </button>
      </div>

      {/* Document Info and View Tabs */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="flex border-b">
          <button
            className={`px-4 py-3 font-medium ${viewMode === 'preview' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => setViewMode('preview')}
          >
            <FaEye className="inline mr-2" />
            Preview Document
          </button>
          <button
            className={`px-4 py-3 font-medium ${viewMode === 'info' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => setViewMode('info')}
          >
            <FaFileAlt className="inline mr-2" />
            Document Information
          </button>
        </div>

        <div className="p-6">
          {/* Document Title */}
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            {document?.title || 'Untitled Document'}
          </h3>
          
          {viewMode === 'preview' ? (
            // Document Preview
            renderDocumentPreview()
          ) : (
            // Document Information
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center mb-2">
                    <FaUser className="text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-gray-500">Student Name:</span>
                  </div>
                  <p className="font-semibold">{document?.owner?.fullName || 'Unknown'}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center mb-2">
                    <FaFileAlt className="text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-gray-500">Document Type:</span>
                  </div>
                  <p className="font-semibold">{document?.documentType || 'Unknown'}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center mb-2">
                    <FaCalendarAlt className="text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-gray-500">Uploaded Date:</span>
                  </div>
                  <p className="font-semibold">
                    {document?.createdAt ? new Date(document.createdAt).toLocaleString() : 'Unknown'}
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center mb-2">
                    <FaFileAlt className="text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-gray-500">File Name:</span>
                  </div>
                  <p className="font-semibold">{document?.fileName || 'Unknown'}</p>
                </div>
              </div>
              
              {document?.description && (
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="mb-2">
                    <span className="text-sm font-medium text-gray-500">Description:</span>
                  </div>
                  <p>{document.description}</p>
                </div>
              )}
              
              <div className="flex justify-center">
                <button
                  onClick={handleDownload}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded flex items-center"
                >
                  <FaDownload className="mr-2" />
                  Download Document
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Approval Action Section */}
      {canApproveDocument() && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Verification Action</h3>
          
          <div className="mb-4">
            <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
              Feedback (Optional for approval, Required for rejection)
            </label>
            <textarea
              id="feedback"
              rows="3"
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter any feedback about your verification decision..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
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
                  Reject Document
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
                  Approve Document
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentReviewPage;