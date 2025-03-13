import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { FiFileText, FiEye, FiDownload, FiCheckCircle, FiXCircle, FiClock } from "react-icons/fi";
import axios from "axios";
import { useAuth } from "../../../../context/AuthContext";
import { format } from "date-fns";
import toast, { Toaster } from "react-hot-toast";

const Documentss = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          toast.error("Authentication token not found. Please log in again.");
          setLoading(false);
          return;
        }
        
        // Get documents from the API
        const response = await axios.get('/api/documents/student', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        setDocuments(response.data);
      } catch (error) {
        console.error("Error fetching documents:", error);
        toast.error("Failed to load documents");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDocuments();
    }
  }, [user]);

  // Format date 
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch (error) {
      return "Invalid date";
    }
  };

  // Get status icon and color
  const getStatusDisplay = (status) => {
    if (status === 'approved') {
      return {
        icon: <FiCheckCircle className="mr-1" />,
        text: "Approved",
        className: "bg-green-100 text-green-800"
      };
    } else if (status === 'rejected') {
      return {
        icon: <FiXCircle className="mr-1" />,
        text: "Rejected",
        className: "bg-red-100 text-red-800"
      };
    } else {
      return {
        icon: <FiClock className="mr-1" />,
        text: "Pending",
        className: "bg-yellow-100 text-yellow-800"
      };
    }
  };

  // Get document counts by status
  const getDocumentCounts = () => {
    return {
      total: documents.length,
      approved: documents.filter(doc => doc.status === 'approved').length,
      pending: documents.filter(doc => doc.status === 'pending').length,
      rejected: documents.filter(doc => doc.status === 'rejected').length
    };
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
    
    const statusDisplay = getStatusDisplay(document.status);
    
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
                {document.reviewDate && (
                  <div>
                    <p className="text-sm text-gray-500">Review Date</p>
                    <p className="font-medium">{formatDate(document.reviewDate)}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Submission Date</p>
                  <p className="font-medium">{formatDate(document.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className={`font-medium inline-flex items-center ${
                    document.status === 'approved' ? 'text-green-600' : 
                    document.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {statusDisplay.icon} {statusDisplay.text}
                  </p>
                </div>
              </div>
              
              {document.description && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Description</p>
                  <p>{document.description}</p>
                </div>
              )}
              
              {document.rejectionReason && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Rejection Reason</p>
                  <p className="text-red-600">{document.rejectionReason}</p>
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
              {document.status === 'approved' && (
                <button 
                  onClick={() => handleDownloadDocument(document._id)}
                  className="flex items-center px-4 py-2 bg-[#C3A135] text-white rounded hover:bg-[#a4862a]"
                >
                  <FiDownload className="mr-2" /> Download
                </button>
              )}
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
      name: "Submitted On",
      selector: row => formatDate(row.createdAt),
      sortable: true,
    },
    {
      name: "Status",
      cell: row => {
        const status = getStatusDisplay(row.status);
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status.className}`}>
            {status.icon} {status.text}
          </span>
        );
      },
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
          {row.status === 'approved' && (
            <button
              onClick={() => handleDownloadDocument(row._id)}
              className="flex items-center text-green-600 hover:text-green-800"
            >
              <FiDownload className="mr-1" /> Download
            </button>
          )}
        </div>
      ),
    },
  ];

  const counts = getDocumentCounts();

  return (
    <div className="p-6">
      <Toaster position="top-right" />
      
      <div className="text-2xl font-bold text-[#1E3A8A] flex items-center mb-6">
        <FiFileText className="mr-2" />
        <h2>My Documents</h2>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white px-4 py-3 rounded-md shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-full mr-3">
              <FiFileText className="text-blue-600 text-lg" />
            </div>
            <div>
              <p className="text-gray-800 font-medium">
                <span className="text-blue-600 font-semibold">{counts.total}</span> total document{counts.total !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-gray-500">All documents</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white px-4 py-3 rounded-md shadow-sm border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="bg-green-100 p-2 rounded-full mr-3">
              <FiCheckCircle className="text-green-600 text-lg" />
            </div>
            <div>
              <p className="text-gray-800 font-medium">
                <span className="text-green-600 font-semibold">{counts.approved}</span> approved
              </p>
              <p className="text-xs text-gray-500">Ready for download</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white px-4 py-3 rounded-md shadow-sm border-l-4 border-yellow-500">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-2 rounded-full mr-3">
              <FiClock className="text-yellow-600 text-lg" />
            </div>
            <div>
              <p className="text-gray-800 font-medium">
                <span className="text-yellow-600 font-semibold">{counts.pending}</span> pending
              </p>
              <p className="text-xs text-gray-500">Awaiting review</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white px-4 py-3 rounded-md shadow-sm border-l-4 border-red-500">
          <div className="flex items-center">
            <div className="bg-red-100 p-2 rounded-full mr-3">
              <FiXCircle className="text-red-600 text-lg" />
            </div>
            <div>
              <p className="text-gray-800 font-medium">
                <span className="text-red-600 font-semibold">{counts.rejected}</span> rejected
              </p>
              <p className="text-xs text-gray-500">Requires attention</p>
            </div>
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
              <FiFileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500">No documents found</p>
              <p className="text-sm text-gray-400 mt-2">
                Upload new documents to see them here
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

export default Documentss;