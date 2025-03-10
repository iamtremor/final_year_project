import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import axios from "axios";
import { useAuth } from "../../../../context/AuthContext";
import { FiFile, FiEye } from "react-icons/fi";

const Documents = ({ documentsData, blockchainDocuments, isLoading }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifiedDocTypes, setVerifiedDocTypes] = useState([]);
  const { user } = useAuth();

  // Helper function to get verified document types
  const getVerifiedDocTypes = (blockchainDocs) => {
    if (!blockchainDocs || blockchainDocs.length === 0) return [];

    // Extract unique document types from blockchain documents
    const types = blockchainDocs
      .filter(doc => doc.documentType) // Filter out documents without type
      .map(doc => doc.documentType.toLowerCase().trim()); // Normalize to lowercase
    
    // Remove duplicates with Set
    return [...new Set(types)];
  };

  // Function to check if a document is verified on blockchain
  // In Documents.jsx
const isDocumentVerified = (doc) => {
  // Check if essential document properties are missing
  if (!doc.documentType || !blockchainDocuments || blockchainDocuments.length === 0) return false;

  // Normalize document type and title for comparison
  const normalizedDocType = doc.documentType?.toLowerCase().trim();
  const normalizedDocTitle = doc.title?.toLowerCase().trim();

  // Find matching documents in blockchain
  const matchingDocs = blockchainDocuments.filter(bdoc => 
    bdoc.documentType?.toLowerCase().trim() === normalizedDocType &&
    bdoc.title?.toLowerCase().trim() === normalizedDocTitle
  );

  // Return true if there are matching documents
  return matchingDocs.length > 0;
};

  // If props are provided, use them. Otherwise, fetch data.
  useEffect(() => {
    if (documentsData) {
      setDocuments(documentsData);
      setLoading(false);
    } else {
      // Only fetch data if not provided through props
      const fetchDocuments = async () => {
        try {
          setLoading(true);
          const token = localStorage.getItem('token');
          
          // Get documents from the regular API
          const response = await axios.get('/api/documents/student', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          setDocuments(response.data);
        } catch (error) {
          console.error("Error fetching documents:", error);
          setDocuments([]);
        } finally {
          setLoading(false);
        }
      };

      if (user) {
        fetchDocuments();
      }
    }
  }, [documentsData, user]);

  // Get blockchain document types directly from API
  useEffect(() => {
    const fetchBlockchainDocTypes = async () => {
      if (!user?.applicationId) return;
      
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/blockchain/student-documents/${user.applicationId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Extract unique document types from blockchain documents
        const blockchainDocs = response.data.documents || [];
        const uniqueTypes = getVerifiedDocTypes(blockchainDocs);
        
        console.log("Verified blockchain document types:", uniqueTypes);
        setVerifiedDocTypes(uniqueTypes);
      } catch (error) {
        console.error("Failed to fetch blockchain documents:", error);
        setVerifiedDocTypes([]);
      }
    };
    
    // Use blockchainDocuments if provided via props, otherwise fetch
    if (blockchainDocuments && blockchainDocuments.length > 0) {
      const uniqueTypes = getVerifiedDocTypes(blockchainDocuments);
      console.log("Verified blockchain document types (from props):", uniqueTypes);
      setVerifiedDocTypes(uniqueTypes);
    } else if (user?.applicationId) {
      fetchBlockchainDocTypes();
    }
  }, [blockchainDocuments, user]);

  // Function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Invalid date";
    }
  };

  // Debugging log
  useEffect(() => {
    if (documents.length > 0 && blockchainDocuments.length > 0) {
      console.log("LOCAL DOCUMENTS:");
      documents.forEach(doc => {
        console.log(`- Type: "${doc.documentType}", Title: "${doc.title}"`);
      });
      
      console.log("BLOCKCHAIN DOCUMENTS:");
      blockchainDocuments.forEach(doc => {
        console.log(`- Type: "${doc.documentType}", Title: "${doc.title}"`);
      });
    }
  }, [documents, blockchainDocuments]);

  if (isLoading || loading) {
    return (
      <div className="mx-5 bg-white rounded-sm p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-full mb-4"></div>
          <div className="h-24 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="mx-5 bg-white rounded-sm p-6 text-center">
        <FiFile className="text-gray-400 text-5xl mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-800">No Documents Found</h3>
        <p className="text-gray-500 mt-1">You haven't uploaded any documents yet.</p>
        <Link 
          to="/student/upload" 
          className="mt-4 inline-block px-4 py-2 bg-[#1E3A8A] text-white rounded-sm hover:bg-[#152a63]"
        >
          Upload Document
        </Link>
      </div>
    );
  }

  // Log verification status for debugging
  documents.forEach(doc => {
    const docVerified = isDocumentVerified(doc);
    console.log(`Document ${doc.title} (${doc.documentType}): verified=${docVerified}`);
  });

  return (
    <div className="mx-5 bg-white rounded-sm shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Activity
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Blockchain
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {documents.map((doc) => {
              const docVerified = isDocumentVerified(doc);
              
              return (
                <tr key={doc._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {doc.title || "Untitled Document"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {doc.documentType || "Document"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(doc.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${doc.status === 'approved' ? 'bg-green-100 text-green-800' : 
                        doc.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'}`}>
                      {doc.status === 'approved' ? 'Approved' : 
                       doc.status === 'rejected' ? 'Rejected' : 
                       'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {docVerified ? (
                      <span className="text-green-600 font-medium">Verified</span>
                    ) : (
                      <span className="text-gray-400">Not verified</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link 
                      to={`/student/document/${doc._id}`}
                      className="text-[#1E3A8A] hover:text-[#152a63] flex items-center"
                    >
                      <FiEye className="mr-1" /> View
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Documents;