import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  FiFileText, 
  FiClock, 
  FiAlertCircle, 
  FiCheckCircle, 
  FiX, 
  FiEye, 
  FiDownload, 
  FiCalendar,
  FiUpload 
} from "react-icons/fi";
import { format } from "date-fns";
import axios from "axios";
import toast from "react-hot-toast";

const UploadHistory = () => {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [filter, setFilter] = useState("all"); // all, recent, approved, rejected, pending
  const [sortOrder, setSortOrder] = useState("newest"); // newest, oldest
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Fetch all documents for the student
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error("Authentication token not found. Please log in again.");
        setLoading(false);
        return;
      }
      
      const response = await axios.get('/api/documents/student', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setDocuments(response.data);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to load document history");
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch (error) {
      return "Invalid date";
    }
  };

  // Format time
  const formatTime = (dateString) => {
    if (!dateString) return "";
    try {
      return format(new Date(dateString), "h:mm a");
    } catch (error) {
      return "";
    }
  };

  // Get relative time (e.g., "2 days ago")
  const getRelativeTime = (dateString) => {
    if (!dateString) return "N/A";
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
      
      if (diffInDays === 0) {
        return "Today";
      } else if (diffInDays === 1) {
        return "Yesterday";
      } else if (diffInDays < 7) {
        return `${diffInDays} days ago`;
      } else if (diffInDays < 30) {
        const weeks = Math.floor(diffInDays / 7);
        return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
      } else {
        return formatDate(dateString);
      }
    } catch (error) {
      return "N/A";
    }
  };

  // View document details
  const viewDocument = (document) => {
    setSelectedDocument(document);
    setModalOpen(true);
  };

  // Download document
  const downloadDocument = async (documentId) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error("Authentication token not found");
        return;
      }
      
      const response = await axios.get(`/api/documents/download/${documentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'blob'
      });
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from response if available
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'document';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch.length > 1) {
          filename = filenameMatch[1];
        }
      } else {
        // Use document title if no filename provided
        const doc = documents.find(d => d._id === documentId);
        if (doc && doc.title) {
          filename = `${doc.title}.pdf`;
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Document downloaded successfully");
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Failed to download document");
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <FiCheckCircle className="mr-1" /> Approved
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <FiX className="mr-1" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <FiClock className="mr-1" /> Pending
          </span>
        );
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <FiCheckCircle className="text-green-500" />;
      case "rejected":
        return <FiAlertCircle className="text-red-500" />;
      default:
        return <FiClock className="text-yellow-500" />;
    }
  };

  // Filter documents
  const getFilteredDocuments = () => {
    let filtered = [...documents];
    
    // Apply status filter
    if (filter !== "all") {
      filtered = filtered.filter(doc => doc.status === filter);
    }
    
    // Apply sort order
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });
    
    return filtered;
  };

  // Get document type badge color
  const getDocumentTypeBadge = (documentType) => {
    const typeColors = {
      "SSCE": "bg-blue-100 text-blue-800",
      "JAMB": "bg-purple-100 text-purple-800",
      "Transcript": "bg-green-100 text-green-800",
      "Admission Letter": "bg-indigo-100 text-indigo-800",
      "Medical Report": "bg-red-100 text-red-800",
      "Passport": "bg-orange-100 text-orange-800",
      "NIN": "bg-gray-100 text-gray-800"
    };

    return typeColors[documentType] || "bg-gray-100 text-gray-800";
  };

  // View Document Modal
  const DocumentModal = () => {
    if (!modalOpen || !selectedDocument) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#1E3A8A]">
                {selectedDocument.title || "Untitled Document"}
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {/* Document Status */}
            <div className="mb-6 flex items-center">
              {getStatusBadge(selectedDocument.status)}
              <span className="ml-2 text-sm text-gray-500">
                ID: {selectedDocument._id?.slice(-6) || "N/A"}
              </span>
            </div>
            
            {/* Document Details */}
            <div className="mb-4 p-4 bg-gray-50 rounded-md">
              <h4 className="font-medium text-gray-700 mb-3">Document Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Document Type</p>
                  <p className="font-medium">{selectedDocument.documentType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">File Name</p>
                  <p className="font-medium">{selectedDocument.fileName || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Uploaded On</p>
                  <p className="font-medium">{formatDate(selectedDocument.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">File Size</p>
                  <p className="font-medium">
                    {selectedDocument.fileSize 
                      ? `${(selectedDocument.fileSize / 1024).toFixed(2)} KB` 
                      : "N/A"}
                  </p>
                </div>
              </div>
              
              {selectedDocument.description && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="mt-1">{selectedDocument.description}</p>
                </div>
              )}
            </div>
            
            {/* Status Information */}
            <div className={`mb-4 p-4 rounded-md ${
              selectedDocument.status === "approved" ? "bg-green-50 border-l-4 border-green-500" :
              selectedDocument.status === "rejected" ? "bg-red-50 border-l-4 border-red-500" :
              "bg-yellow-50 border-l-4 border-yellow-500"
            }`}>
              <div className="flex items-start">
                {getStatusIcon(selectedDocument.status)}
                <div className="ml-3">
                  <h4 className="font-medium">
                    {selectedDocument.status === "approved" ? "Document Approved" :
                     selectedDocument.status === "rejected" ? "Document Rejected" :
                     "Pending Review"}
                  </h4>
                  
                  {selectedDocument.status === "approved" ? (
                    <p className="text-sm mt-1">
                      This document has been reviewed and approved by staff on {formatDate(selectedDocument.reviewDate)}.
                    </p>
                  ) : selectedDocument.status === "rejected" ? (
                    <p className="text-sm mt-1">
                      This document was rejected. {selectedDocument.feedback ? `Reason: ${selectedDocument.feedback}` : ""}
                    </p>
                  ) : (
                    <p className="text-sm mt-1">
                      This document is waiting for review by staff. You will be notified when it's approved or rejected.
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Blockchain Information (if available) */}
            {selectedDocument.blockchainTxHash && (
              <div className="mb-4 p-4 bg-indigo-50 rounded-md">
                <h4 className="font-medium text-gray-700 mb-2">Blockchain Verification</h4>
                <div>
                  <p className="text-sm text-gray-500">Transaction Hash</p>
                  <p className="font-mono text-xs overflow-auto break-all">
                    {selectedDocument.blockchainTxHash}
                  </p>
                </div>
                
                {selectedDocument.blockchainBlockNumber && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">Block Number</p>
                    <p>{selectedDocument.blockchainBlockNumber}</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              {selectedDocument.status === "approved" && (
                <button
                  onClick={() => downloadDocument(selectedDocument._id)}
                  className="px-4 py-2 bg-[#1E3A8A] text-white rounded-md hover:bg-[#152a63] flex items-center"
                >
                  <FiDownload className="mr-2" /> Download
                </button>
              )}
              
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <DocumentModal />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-[#1E3A8A] mb-4 sm:mb-0">Upload History</h3>
        
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
          {/* Filter Dropdown */}
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#1E3A8A] focus:border-[#1E3A8A] sm:text-sm rounded-md"
            >
              <option value="all">All Documents</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          
          {/* Sort Order Toggle */}
          <div className="relative">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#1E3A8A] focus:border-[#1E3A8A] sm:text-sm rounded-md"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Loading State */}
      {loading && (
        <div className="py-8 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E3A8A]"></div>
        </div>
      )}
      
      {/* Empty State */}
      {!loading && documents.length === 0 && (
        <div className="py-8 text-center">
          <FiFileText className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No upload history</h3>
          <p className="mt-1 text-sm text-gray-500">
            You haven't uploaded any documents yet.
          </p>
          <div className="mt-6">
            <Link
              to="/student/upload"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#1E3A8A] hover:bg-[#152a63]"
            >
              <FiUpload className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Upload Document
            </Link>
          </div>
        </div>
      )}
      
      {/* Document List */}
      {!loading && documents.length > 0 && (
        <div className="mt-2">
          <ul className="divide-y divide-gray-200">
            {getFilteredDocuments().map((document) => (
              <li 
                key={document._id} 
                className="py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => viewDocument(document)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start">
                    <div className={`flex-shrink-0 h-10 w-10 rounded-md flex items-center justify-center ${
                      document.status === "approved" ? "bg-green-100" :
                      document.status === "rejected" ? "bg-red-100" :
                      "bg-yellow-100"
                    }`}>
                      {getStatusIcon(document.status)}
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {document.title || "Untitled Document"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {getRelativeTime(document.createdAt)}
                        </p>
                      </div>
                      <div className="mt-1 flex items-center">
                        <span className={`inline-flex text-xs px-2 py-0.5 rounded-full ${getDocumentTypeBadge(document.documentType)}`}>
                          {document.documentType}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          Uploaded on {formatDate(document.createdAt)} at {formatTime(document.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0 flex">
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                      onClick={(e) => {
                        e.stopPropagation();
                        viewDocument(document);
                      }}
                    >
                      <span className="sr-only">View</span>
                      <FiEye className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                
                {/* Status & Review Info */}
                {document.status !== "pending" && (
                  <div className="mt-2 ml-14">
                    <p className="text-xs text-gray-500">
                      {document.status === "approved" ? 
                        `Approved on ${formatDate(document.reviewDate)}` : 
                        `Rejected on ${formatDate(document.reviewDate)}`}
                    </p>
                    {document.feedback && document.status === "rejected" && (
                      <p className="text-xs text-red-600 mt-1">
                        Reason: {document.feedback}
                      </p>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* No Results After Filtering */}
      {!loading && documents.length > 0 && getFilteredDocuments().length === 0 && (
        <div className="py-8 text-center">
          <FiFileText className="mx-auto h-10 w-10 text-gray-300" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No documents match the filter</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try changing your filter or sort settings.
          </p>
        </div>
      )}
      
      {/* Document Stats (Only show if there are documents) */}
      {!loading && documents.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-3 rounded-md">
              <div className="flex items-center">
                <FiFileText className="text-blue-600 mr-2" />
                <div>
                  <p className="text-sm font-medium">Total Documents</p>
                  <p className="text-lg font-bold text-blue-600">{documents.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-3 rounded-md">
              <div className="flex items-center">
                <FiCheckCircle className="text-green-600 mr-2" />
                <div>
                  <p className="text-sm font-medium">Approved</p>
                  <p className="text-lg font-bold text-green-600">
                    {documents.filter(d => d.status === "approved").length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-3 rounded-md">
              <div className="flex items-center">
                <FiClock className="text-yellow-600 mr-2" />
                <div>
                  <p className="text-sm font-medium">Pending Review</p>
                  <p className="text-lg font-bold text-yellow-600">
                    {documents.filter(d => d.status === "pending").length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadHistory;