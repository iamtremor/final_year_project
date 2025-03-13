import React, { useState, useEffect } from "react";
import { FiTrash2, FiAlertCircle, FiCheckCircle, FiClock } from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";

const DocumentManagement = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, documentId: null });
  
  // Fetch student's documents when component mounts
  useEffect(() => {
    fetchDocuments();
  }, []);
  
  // Function to fetch all documents for the student
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
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };
  
  // Function to delete a document
  const deleteDocument = async (documentId) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error("Authentication token not found");
        return;
      }
      
      // Call the API to delete the document
      await axios.delete(`/api/documents/${documentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Remove the document from state
      setDocuments(documents.filter(doc => doc._id !== documentId));
      
      toast.success("Document deleted successfully");
      setDeleteModal({ isOpen: false, documentId: null });
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error(error.response?.data?.message || "Failed to delete document");
    }
  };
  
  // Function to get status badge
  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <FiCheckCircle className="mr-1" /> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <FiAlertCircle className="mr-1" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <FiClock className="mr-1" /> Pending
          </span>
        );
    }
  };
  
  // Function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Delete Confirmation Modal
  const DeleteConfirmationModal = () => {
    if (!deleteModal.isOpen) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete this document? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setDeleteModal({ isOpen: false, documentId: null })}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteDocument(deleteModal.documentId)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E3A8A]"></div>
      </div>
    );
  }
  
  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-md shadow-sm p-8 text-center">
        <p className="text-gray-500">No documents found. Upload documents to manage them here.</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-md shadow-sm overflow-hidden">
      <DeleteConfirmationModal />
      
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Document Name
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Document Type
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date Uploaded
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {documents.map((document) => (
            <tr key={document._id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{document.title || "Untitled Document"}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{document.documentType}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{formatDate(document.createdAt)}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(document.status)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <button
                  onClick={() => setDeleteModal({ isOpen: true, documentId: document._id })}
                  className="text-red-600 hover:text-red-900"
                  disabled={document.status === 'approved'}
                  title={document.status === 'approved' ? "Cannot delete approved documents" : "Delete document"}
                >
                  <FiTrash2 className={`h-5 w-5 ${document.status === 'approved' ? 'opacity-30 cursor-not-allowed' : ''}`} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DocumentManagement;