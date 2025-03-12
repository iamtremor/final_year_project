import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { FiClock, FiEye, FiAlertTriangle, FiUpload } from "react-icons/fi";
import axios from "axios";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

const PendingDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [isWithinDeadline, setIsWithinDeadline] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          toast.error("Authentication token not found. Please log in again.");
          setLoading(false);
          return;
        }
        
        // Get the current user to get applicationId for deadline check
        const userResponse = await axios.get('/api/users/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const applicationId = userResponse.data.applicationId;
        
        // Check if within deadline
        if (applicationId) {
          try {
            const deadlineResponse = await axios.get(`/api/blockchain/applications/within-deadline/${applicationId}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            setIsWithinDeadline(deadlineResponse.data.isWithinDeadline);
          } catch (deadlineError) {
            console.error("Error checking deadline:", deadlineError);
            // Default to true if there's an error
            setIsWithinDeadline(true);
          }
        }
        
        // Fetch documents
        const response = await axios.get('/api/documents/student', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // Filter only pending documents
        const pendingDocs = response.data.filter(doc => doc.status === 'pending');
        setDocuments(pendingDocs);
      } catch (error) {
        console.error("Error fetching pending documents:", error);
        toast.error("Failed to load pending documents");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch (error) {
      return "Invalid date";
    }
  };

  // Calculate days pending
  const calculateDaysPending = (dateString) => {
    if (!dateString) return "N/A";
    
    try {
      const submissionDate = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - submissionDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } catch (error) {
      return "N/A";
    }
  };

  // Handle view document details
  const handleViewDocument = (document) => {
    setSelectedDocument(document);
    setViewModalOpen(true);
  };

  // Document View Modal Component
  const DocumentViewModal = ({ isOpen, onClose, document }) => {
    if (!isOpen || !document) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#1E3A8A]">
                {document.title || "Document"}
              </h3>
              <button 
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4 p-4 bg-gray-50 rounded-md">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium text-gray-700">Document Information</h4>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                  Pending Review
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Document Type</p>
                  <p className="font-medium">{document.documentType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Submission Date</p>
                  <p className="font-medium">{formatDate(document.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">File Name</p>
                  <p className="font-medium">{document.fileName || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">File Size</p>
                  <p className="font-medium">
                    {document.fileSize ? `${(document.fileSize / 1024).toFixed(2)} KB` : "N/A"}
                  </p>
                </div>
              </div>
              
              {document.description && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Description</p>
                  <p>{document.description}</p>
                </div>
              )}
            </div>
            
            <div className="mb-4 p-4 bg-yellow-50 rounded-md border-l-4 border-yellow-400">
              <div className="flex items-start">
                <FiClock className="text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-yellow-800">Pending Approval</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    This document is currently awaiting review by a staff member.
                    Documents are typically reviewed within 2-3 business days.
                  </p>
                  <p className="text-sm text-yellow-800 font-medium mt-2">
                    Pending for: {calculateDaysPending(document.createdAt)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button 
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Define table columns
  const columns = [
    {
      name: "Document Name",
      selector: row => row.title || "Untitled Document",
      sortable: true,
      cell: row => (
        <div className="py-2">
          <p className="font-medium">{row.title || "Untitled Document"}</p>
          <p className="text-xs text-gray-500">{row.documentType}</p>
        </div>
      )
    },
    {
      name: "Submitted On",
      selector: row => formatDate(row.createdAt),
      sortable: true,
    },
    {
      name: "Status",
      cell: row => (
        <div className="flex items-center">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <FiClock className="mr-1" /> Pending Review
          </span>
        </div>
      ),
    },
    {
      name: "Pending For",
      selector: row => calculateDaysPending(row.createdAt),
      sortable: true,
    },
    {
      name: "Actions",
      cell: row => (
        <button
          onClick={() => handleViewDocument(row)}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <FiEye className="mr-1" /> View Details
        </button>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Toaster position="top-right" />
      
      <div className="text-2xl font-bold text-[#1E3A8A] flex items-center mb-6">
        <FiClock className="mr-2" />
        <h2>Pending Documents</h2>
      </div>
      
      {/* Deadline Warning */}
      {!isWithinDeadline && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-md">
          <div className="flex items-start">
            <FiAlertTriangle className="text-red-500 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-red-800">Submission Deadline Passed</h3>
              <p className="text-sm text-red-700 mt-1">
                The deadline for document submissions has passed. You cannot upload new documents at this time.
                Contact administration if you need assistance.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Stats Card - More compact design */}
      <div className="flex justify-between items-center bg-white px-4 py-3 rounded-md shadow-sm mb-6 border-l-4 border-yellow-500">
        <div className="flex items-center">
          <div className="bg-yellow-100 p-2 rounded-full mr-3">
            <FiClock className="text-yellow-600 text-lg" />
          </div>
          <div>
            <p className="text-gray-800 font-medium">
              <span className="text-yellow-600 font-semibold">{documents.length}</span> document{documents.length !== 1 ? 's' : ''} awaiting review
            </p>
            <p className="text-xs text-gray-500">You'll be notified when they're approved</p>
          </div>
        </div>
        
        {isWithinDeadline && (
          <Link to="/student/upload" className="flex items-center px-3 py-2 bg-[#1E3A8A] text-white text-sm rounded hover:bg-[#152a63]">
            <FiUpload className="mr-1" /> Upload New
          </Link>
        )}
      </div>
      
      {/* Documents Table */}
      <div className="bg-white rounded-md shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={documents}
          pagination
          progressPending={loading}
          progressComponent={
            <div className="py-6 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E3A8A]"></div>
            </div>
          }
          noDataComponent={
            <div className="p-6 text-center">
              <FiClock className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500">No pending documents found</p>
              <p className="text-sm text-gray-400 mt-2">
                {isWithinDeadline ? 
                  "Upload documents to start the approval process" :
                  "The submission deadline has passed"}
              </p>
              {isWithinDeadline && (
                <Link to="/student/upload" className="inline-block mt-4 px-4 py-2 bg-[#1E3A8A] text-white rounded hover:bg-[#152a63]">
                  <FiUpload className="inline mr-2" /> Upload Document
                </Link>
              )}
            </div>
          }
          highlightOnHover
          pointerOnHover
        />
      </div>
      
      {/* Document View Modal */}
      <DocumentViewModal 
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        document={selectedDocument}
      />
    </div>
  );
};

export default PendingDocuments;