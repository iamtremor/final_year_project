import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { 
  FiCheckCircle, 
  FiAlertTriangle, 
  FiClock, 
  FiEye, 
  FiBarChart2,
  FiXCircle,
  FiFileText
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
          toast.error("Authentication token not found");
          setLoading(false);
          return;
        }
        
        // Fetch all documents
        const response = await axios.get('/api/documents/student', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const allDocs = response.data;
        setDocuments(allDocs);
        
        // Calculate statistics
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

  // Calculate progress percentage
  const calculateProgress = (status) => {
    switch(status) {
      case 'approved':
        return 100;
      case 'rejected':
        return 0;
      case 'pending':
        return 50;
      default:
        return 0;
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
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold text-[#0D0637]">
                {document.title || "Document"}
              </h3>
              <button 
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-3">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600 text-sm">Status:</span>
                <span className={`font-medium ${
                  document.status === 'approved' ? 'text-green-600' : 
                  document.status === 'rejected' ? 'text-red-600' : 
                  'text-yellow-600'
                }`}>
                  {document.status === 'approved' ? 'Approved' : 
                   document.status === 'rejected' ? 'Rejected' : 'Pending'}
                </span>
              </div>
              
              <div className="flex justify-between mb-2">
                <span className="text-gray-600 text-sm">Document Type:</span>
                <span className="font-medium">{document.documentType}</span>
              </div>
              
              <div className="flex justify-between mb-2">
                <span className="text-gray-600 text-sm">Submitted On:</span>
                <span className="font-medium">{formatDate(document.createdAt)}</span>
              </div>
              
              {document.status !== 'pending' && (
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600 text-sm">Reviewed On:</span>
                  <span className="font-medium">{formatDate(document.reviewDate)}</span>
                </div>
              )}
              
              {document.feedback && (
                <div className="mt-3">
                  <span className="text-gray-600 text-sm">Feedback:</span>
                  <p className="mt-1 text-sm border-l-2 border-gray-300 pl-2">{document.feedback}</p>
                </div>
              )}
            </div>
            
            {document.blockchainTxHash && (
              <div className="mb-3 mt-4 p-2 bg-blue-50 rounded text-sm">
                <p className="text-blue-800 font-medium">Blockchain Verified</p>
                <p className="text-xs text-blue-600 mt-1 break-all">{document.blockchainTxHash}</p>
              </div>
            )}
            
            <div className="mt-4 flex justify-end">
              <button 
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm"
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
      name: "Date",
      selector: row => formatDate(row.createdAt),
      sortable: true,
    },
    {
      name: "Status",
      selector: row => row.status,
      sortable: true,
      cell: row => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.status === 'approved' ? 'bg-green-100 text-green-800' : 
          row.status === 'rejected' ? 'bg-red-100 text-red-800' : 
          'bg-yellow-100 text-yellow-800'
        }`}>
          {row.status === 'approved' ? 'Approved' : 
           row.status === 'rejected' ? 'Rejected' : 'Pending'}
        </span>
      ),
    },
    {
      name: "Progress",
      cell: row => (
        <div className="w-full">
          <div className="w-24 bg-gray-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${
                row.status === 'approved' ? 'bg-green-600' : 
                row.status === 'rejected' ? 'bg-red-600' : 
                'bg-yellow-600'
              }`}
              style={{ width: `${calculateProgress(row.status)}%` }}
            ></div>
          </div>
        </div>
      )
    },
    {
      name: "Actions",
      cell: row => (
        <button
          onClick={() => handleViewDocument(row)}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          View
        </button>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Toaster position="top-right" />
      
      <div className="text-2xl font-bold text-[#0D0637] mb-4">
        Track Document Status
      </div>
      
      {/* Status cards in a single row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-3 rounded-md shadow-sm border-t-2 border-[#0D0637]">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-xs">Total</span>
            <span className="bg-gray-100 px-2 py-1 rounded-full text-xs">{stats.total}</span>
          </div>
          <p className="text-lg font-semibold mt-1">{stats.total} Documents</p>
        </div>
        
        <div className="bg-white p-3 rounded-md shadow-sm border-t-2 border-green-500">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-xs">Approved</span>
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">{stats.approved}</span>
          </div>
          <p className="text-lg font-semibold mt-1 text-green-600">{stats.approved} Documents</p>
        </div>
        
        <div className="bg-white p-3 rounded-md shadow-sm border-t-2 border-yellow-500">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-xs">Pending</span>
            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">{stats.pending}</span>
          </div>
          <p className="text-lg font-semibold mt-1 text-yellow-600">{stats.pending} Documents</p>
        </div>
        
        <div className="bg-white p-3 rounded-md shadow-sm border-t-2 border-red-500">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-xs">Rejected</span>
            <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">{stats.rejected}</span>
          </div>
          <p className="text-lg font-semibold mt-1 text-red-600">{stats.rejected} Documents</p>
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
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0D0637]"></div>
            </div>
          }
          noDataComponent={
            <div className="p-4 text-center">
              <p className="text-gray-500">No documents found</p>
            </div>
          }
          highlightOnHover
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

export default TrackStatus;