import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { 
  FiFileText, 
  FiCheckCircle, 
  FiAlertTriangle, 
  FiClock, 
  FiEye 
} from "react-icons/fi";
import axios from "axios";
import { format } from "date-fns";
import toast, { Toaster } from "react-hot-toast";

const TrackStatus = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0
  });

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
        
        const response = await axios.get('/api/documents/student', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const allDocs = response.data;
        setDocuments(allDocs);
        
        const approved = allDocs.filter(doc => doc.status === 'approved').length;
        const pending = allDocs.filter(doc => doc.status === 'pending').length;
        const rejected = allDocs.filter(doc => doc.status === 'rejected').length;
        
        setStats({
          total: allDocs.length,
          approved,
          pending,
          rejected
        });
      } catch (error) {
        console.error("Error fetching documents:", error);
        toast.error("Failed to load documents");
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
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
                  <p className="text-sm text-gray-500">Status</p>
                  <p className={`font-medium ${
                    document.status === 'approved' ? 'text-green-600' : 
                    document.status === 'rejected' ? 'text-red-600' : 
                    'text-yellow-600'
                  }`}>
                    {document.status === 'approved' ? 'Approved' : 
                     document.status === 'rejected' ? 'Rejected' : 
                     'Pending'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Submission Date</p>
                  <p className="font-medium">{formatDate(document.createdAt)}</p>
                </div>
                {document.status !== 'pending' && (
                  <div>
                    <p className="text-sm text-gray-500">Review Date</p>
                    <p className="font-medium">{formatDate(document.reviewDate)}</p>
                  </div>
                )}
              </div>
              
              {document.feedback && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Feedback</p>
                  <p className="border-l-4 border-gray-300 pl-3 py-2 text-gray-700">
                    {document.feedback}
                  </p>
                </div>
              )}
            </div>
            
            {document.blockchainTxHash && (
              <div className="mb-4 p-4 bg-gray-50 rounded-md">
                <h4 className="font-medium text-gray-700 mb-2">Blockchain Verification</h4>
                <div>
                  <p className="text-sm text-gray-500">Transaction Hash</p>
                  <p className="font-mono text-sm overflow-x-auto break-all">
                    {document.blockchainTxHash}
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
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
        <div>
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
      selector: row => row.status,
      sortable: true,
      cell: row => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium 
          ${row.status === 'approved' ? 'bg-green-100 text-green-800' : 
            row.status === 'rejected' ? 'bg-red-100 text-red-800' : 
            'bg-yellow-100 text-yellow-800'}`}
        >
          {row.status === 'approved' ? 'Approved' : 
           row.status === 'rejected' ? 'Rejected' : 
           'Pending'}
        </span>
      ),
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
        <button
          onClick={() => handleViewDocument(row)}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <FiEye className="mr-1" /> View
        </button>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Toaster position="top-right" />
      
      <div className="text-2xl font-bold text-[#1E3A8A] flex items-center mb-6">
        <FiFileText className="mr-2" />
        <h2>Track Document Status</h2>
      </div>
      
      {/* Stats Card - Compact design */}
      <div className="flex justify-between items-center bg-white px-4 py-3 rounded-md shadow-sm mb-6 border-l-4 border-[#1E3A8A]">
        <div className="flex items-center">
          <div className="bg-gray-100 p-2 rounded-full mr-3">
            <FiFileText className="text-[#1E3A8A] text-lg" />
          </div>
          <div>
            <p className="text-gray-800 font-medium">
              <span className="text-[#1E3A8A] font-semibold">{stats.total}</span> total document{stats.total !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-gray-500">
              {stats.approved} approved, {stats.pending} pending, {stats.rejected} rejected
            </p>
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
                Your submitted documents will appear here
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

export default TrackStatus;