import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { FiFileText, FiShield, FiCheck, FiClock, FiExternalLink } from "react-icons/fi";
import axios from "axios";
import { useAuth } from "../../../../context/AuthContext";
import { format } from "date-fns";
import toast, { Toaster } from "react-hot-toast";

const BlockchainVerified = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchBlockchainDocuments = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!user?.applicationId) {
          toast.error("Application ID not found");
          setLoading(false);
          return;
        }
        
        const response = await axios.get(`/api/blockchain/student-documents/${user.applicationId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data.documents && response.data.documents.length > 0) {
          // Format documents for display
          const formattedDocs = response.data.documents.map(doc => ({
            id: doc.id || doc._id || Math.random().toString(36).substr(2, 9),
            title: doc.title || "Document",
            documentType: doc.documentType,
            documentHash: doc.documentHash,
            status: doc.status,
            verifiedDate: doc.uploadTime ? format(new Date(doc.uploadTime * 1000), "yyyy-MM-dd") : "N/A",
            reviewDate: doc.reviewTime ? format(new Date(doc.reviewTime * 1000), "yyyy-MM-dd") : "N/A",
            blockNumber: doc.blockNumber || "N/A",
            transactionHash: doc.transactionHash || "N/A",
            // Store original doc for reference
            originalDoc: doc
          }));
          
          setDocuments(formattedDocs);
        } else {
          setDocuments([]);
        }
      } catch (error) {
        console.error("Error fetching blockchain documents:", error);
        toast.error("Failed to fetch blockchain documents");
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchBlockchainDocuments();
    }
  }, [user]);

  const openVerificationDetails = (doc) => {
    setSelectedDoc(doc);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedDoc(null);
  };

  // Define table columns
  const columns = [
    {
      name: <div className="font-bold text-[#4A5568]">DOCUMENT</div>,
      selector: (row) => <div className="text-[#1C065A]">{row.title}</div>,
    },
    {
      name: <div className="font-bold text-[#4A5568]">TYPE</div>,
      selector: (row) => <div className="text-[#1C065A]">{row.documentType}</div>,
    },
    {
      name: <div className="font-bold text-[#4A5568]">VERIFICATION DATE</div>,
      selector: (row) => <div className="text-[#1C065A]">{row.verifiedDate}</div>,
    },
    {
      name: <div className="font-bold text-[#4A5568]">STATUS</div>,
      selector: (row) => (
        <div className="flex items-center">
          <div
            className={`${
              row.status === "approved"
                ? "text-green-600"
                : row.status === "pending"
                ? "text-yellow-500"
                : "text-red-600"
            } font-semibold mr-2`}
          >
            {row.status === "approved" ? "Approved" : 
             row.status === "rejected" ? "Rejected" : "Pending"}
          </div>
          <FiCheck className={row.status === "approved" ? "text-green-600" : "hidden"} />
        </div>
      ),
    },
    {
      name: <div className="font-bold text-[#4A5568]">ACTIONS</div>,
      cell: (row) => (
        <button
          onClick={() => openVerificationDetails(row)}
          className="text-[#1E3A8A] hover:text-[#152a63] flex items-center"
        >
          <FiShield className="mr-1" /> Verify
        </button>
      ),
    },
  ];
  useEffect(() => {
    if (documents.length > 0) {
      console.log("BLOCKCHAIN VERIFIED DOCUMENTS:");
      documents.forEach(doc => {
        console.log(`- Type: "${doc.documentType}", Title: "${doc.title}"`);
      });
    }
  }, [documents]);
  // Fallback data for testing UI
  const fallbackData = [
    {
      id: 1,
      title: "SSCE Certificate",
      documentType: "Academic",
      verifiedDate: "2025-01-07",
      status: "approved",
      documentHash: "0x9a6e64e6a5a5c5d5e5f5a5b5c5d5e5f5a5b5c5d5e5f5a5b5c5d5e5f5a5b5c5d",
      blockNumber: "12345678",
      transactionHash: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b"
    },
    {
      id: 2,
      title: "Admission Letter",
      documentType: "Official Document",
      verifiedDate: "2025-01-06",
      status: "pending",
      documentHash: "0x8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c",
      blockNumber: "12345679",
      transactionHash: "0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d"
    },
    {
      id: 3,
      title: "JAMB Result",
      documentType: "Academic",
      verifiedDate: "2025-01-03",
      status: "rejected",
      documentHash: "0x7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d",
      blockNumber: "12345680",
      transactionHash: "0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f"
    }
  ];

  return (
    <div className="p-6">
      <Toaster position="top-right" />
      <div className="text-2xl font-bold text-[#1E3A8A] flex items-center mb-6">
        <FiShield className="mr-2" />
        <h2>Blockchain Verified Documents</h2>
      </div>

      {/* Blockchain Explanation Card */}
      <div className="bg-white p-4 rounded-md shadow-sm mb-6 border-l-4 border-[#3B2774]">
        <h3 className="text-lg font-medium text-[#1E3A8A] mb-2">Document Verification</h3>
        <p className="text-gray-600 mb-2">
          Your documents are securely hashed and stored on the blockchain, providing tamper-proof verification 
          and ensuring the integrity of your academic records.
        </p>
        <div className="flex items-center text-sm text-gray-500">
          <FiCheck className="text-green-500 mr-1" /> 
          <span>Immutable record</span>
          <FiCheck className="text-green-500 ml-4 mr-1" /> 
          <span>Tamper-proof</span>
          <FiCheck className="text-green-500 ml-4 mr-1" /> 
          <span>Cryptographically secure</span>
        </div>
      </div>

      <div className="bg-white rounded-md shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={documents.length > 0 ? documents : loading ? [] : fallbackData}
          pagination
          progressPending={loading}
          progressComponent={
            <div className="py-6 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E3A8A]"></div>
            </div>
          }
          highlightOnHover
          noDataComponent={
            <div className="p-8 text-center">
              <FiShield className="text-gray-400 text-5xl mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No blockchain verified documents found</p>
              <p className="text-sm text-gray-400 mt-1 mb-4">Upload documents to have them verified on the blockchain</p>
            </div>
          }
          customStyles={{
            headRow: {
              style: {
                backgroundColor: "#fff",
                fontWeight: "bold",
              },
            },
            rows: {
              style: {
                fontSize: "14px",
                cursor: "pointer",
              },
            },
          }}
        />
      </div>

      {/* Verification Details Modal */}
      {showModal && selectedDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-[#1E3A8A] flex items-center">
                  <FiShield className="mr-2" />
                  Blockchain Verification
                </h3>
                <button 
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="mb-4 p-4 bg-gray-50 rounded-md">
                <h4 className="font-medium text-gray-700 mb-2">Document Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Document Name</p>
                    <p className="font-medium">{selectedDoc.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Document Type</p>
                    <p className="font-medium">{selectedDoc.documentType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Verification Date</p>
                    <p className="font-medium">{selectedDoc.verifiedDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className={`font-medium ${
                      selectedDoc.status === "approved" ? "text-green-600" : 
                      selectedDoc.status === "rejected" ? "text-red-600" : 
                      "text-yellow-500"
                    }`}>
                      {selectedDoc.status === "approved" ? "Approved" : 
                       selectedDoc.status === "rejected" ? "Rejected" : "Pending"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">Blockchain Details</h4>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="mb-3">
                    <p className="text-sm text-gray-500">Document Hash</p>
                    <div className="flex items-center">
                      <code className="bg-gray-100 p-1 text-xs overflow-x-auto max-w-full rounded">
                        {selectedDoc.documentHash}
                      </code>
                      <button 
                        onClick={() => {navigator.clipboard.writeText(selectedDoc.documentHash)}}
                        className="ml-2 text-[#1E3A8A] text-sm"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  {selectedDoc.blockNumber !== "N/A" && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-500">Block Number</p>
                      <p className="font-mono text-sm">{selectedDoc.blockNumber}</p>
                    </div>
                  )}

                  {selectedDoc.transactionHash !== "N/A" && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-500">Transaction Hash</p>
                      <div className="flex items-center">
                        <code className="bg-gray-100 p-1 text-xs overflow-x-auto max-w-full rounded">
                          {selectedDoc.transactionHash}
                        </code>
                        <button 
                          onClick={() => {navigator.clipboard.writeText(selectedDoc.transactionHash)}}
                          className="ml-2 text-[#1E3A8A] text-sm"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex items-center text-sm">
                    <FiClock className="mr-1 text-gray-500" />
                    <span className="text-gray-500">Recorded on {selectedDoc.verifiedDate}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                {/* <a 
                  href={`https://etherscan.io/tx/${selectedDoc.transactionHash}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-[#1E3A8A] hover:text-[#152a63]"
                >
                  <FiExternalLink className="mr-1" />
                  View on Blockchain Explorer
                </a> */}
                <button 
                  onClick={closeModal}
                  className="px-4 py-2 bg-[#1E3A8A] text-white rounded hover:bg-[#152a63]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockchainVerified;
