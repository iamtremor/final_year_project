import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { FiCheckCircle, FiEye, FiDownload } from "react-icons/fi";
import axios from "axios";
import { format } from "date-fns";
import toast, { Toaster } from "react-hot-toast";

const ApprovedDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  useEffect(() => {
    const fetchApprovedDocuments = async () => {
      try {
        setLoading(true);
        // Get the auth token from localStorage
        const token = localStorage.getItem('token');
        
        if (!token) {
          toast.error("Authentication token not found. Please log in again.");
          setLoading(false);
          return;
        }
        
        // Fetch all documents for the student
        const response = await axios.get('/api/documents/student', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Filter only approved documents
        const approvedDocs = response.data.filter(doc => doc.status === 'approved');
        setDocuments(approvedDocs);
      } catch (error) {
        console.error("Error fetching approved documents:", error);
        toast.error("Failed to load approved documents");
      } finally {
        setLoading(false);
      }
    };

    fetchApprovedDocuments();
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

  // Handle view document
  const handleViewDocument = (document) => {
    setSelectedDocument(document);
    setViewModalOpen(true);
  };

  // Handle download document
  const handleDownloadDocument = async (documentId) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error("Authentication token not found");
        return;
      }
      
      // Make API call to download document
      const response = await axios.get(`/api/documents/download/${documentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'blob' // Important for file downloads
      });
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Use the document filename from the response headers if available
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'document';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch.length > 1) {
          filename = filenameMatch[1];
        }
      } else {
        // Use document title from our state if available
        const doc = documents.find(d => d._id === documentId);
        if (doc && doc.fileName) {
          filename = doc.fileName;
        } else if (doc && doc.title) {
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

  // View Document Modal
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
              <h4 className="font-medium text-gray-700 mb-2">Document Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Document Type</p>
                  <p className="font-medium">{document.documentType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Approval Date</p>
                  <p className="font-medium">{formatDate(document.reviewDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Submission Date</p>
                  <p className="font-medium">{formatDate(document.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium text-green-600">Approved</p>
                </div>
              </div>
              
              {document.description && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Description</p>
                  <p>{document.description}</p>
                </div>
              )}
            </div>
            
            {document.blockchainTxHash && (
              <div className="mb-4 p-4 bg-gray-50 rounded-md">
                <h4 className="font-medium text-gray-700 mb-2">Blockchain Verification</h4>
                <div>
                  <p className="text-sm text-gray-500">Transaction Hash</p>
                  <p className="font-mono text-sm overflow-x-auto">{document.blockchainTxHash}</p>
                </div>
                {document.blockchainBlockNumber && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">Block Number</p>
                    <p>{document.blockchainBlockNumber}</p>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => handleDownloadDocument(document._id)}
                className="flex items-center px-4 py-2 bg-[#C3A135] text-white rounded hover:bg-[#a4862a]"
              >
                <FiDownload className="mr-2" /> Download
              </button>
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
    },
    {
      name: "Document Type",
      selector: row => row.documentType,
      sortable: true,
    },
    {
      name: "Approved On",
      selector: row => formatDate(row.reviewDate),
      sortable: true,
    },
    {
      name: "Submitted On",
      selector: row => formatDate(row.createdAt),
      sortable: true,
    },
    {
      name: "Blockchain Verified",
      cell: row => (
        <div>
          {row.blockchainTxHash ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <FiCheckCircle className="mr-1" /> Verified
            </span>
          ) : (
            <span className="text-gray-400">Not verified</span>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      name: "Actions",
      cell: row => (
        <div className="flex space-x-3">
          <button
            onClick={() => handleViewDocument(row)}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <FiEye className="mr-1" /> View
          </button>
          <button
            onClick={() => handleDownloadDocument(row._id)}
            className="flex items-center text-green-600 hover:text-green-800"
          >
            <FiDownload className="mr-1" /> Download
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Toaster position="top-right" />
      
      <div className="text-2xl font-bold text-[#1E3A8A] flex items-center mb-6">
        <FiCheckCircle className="mr-2" />
        <h2>Approved Documents</h2>
      </div>
      
      {/* Stats Card - More compact design */}
      <div className="flex justify-between items-center bg-white px-4 py-3 rounded-md shadow-sm mb-6 border-l-4 border-green-500">
        <div className="flex items-center">
          <div className="bg-green-100 p-2 rounded-full mr-3">
            <FiCheckCircle className="text-green-600 text-lg" />
          </div>
          <div>
            <p className="text-gray-800 font-medium">
              <span className="text-green-600 font-semibold">{documents.length}</span> approved document{documents.length !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-gray-500">Ready for download and verification</p>
          </div>
        </div>
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
              <FiCheckCircle className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500">No approved documents found</p>
              <p className="text-sm text-gray-400 mt-2">
                When your documents are approved, they will appear here
              </p>
            </div>
          }
          highlightOnHover
          pointerOnHover
        />
      </div>
      
      {/* View Document Modal */}
      <DocumentViewModal 
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        document={selectedDocument}
      />
    </div>
  );
};

export default ApprovedDocuments;