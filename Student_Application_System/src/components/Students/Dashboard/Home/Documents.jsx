import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { IoIosArrowForward } from "react-icons/io";
import { Link } from "react-router-dom";
import { FiShield, FiInfo } from "react-icons/fi";
import axios from "axios";
import { useAuth } from "../../../../context/AuthContext";
import toast, { Toaster } from "react-hot-toast";

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const [blockchainInfo, setBlockchainInfo] = useState({});

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setIsLoading(true);
        
        // 🔍 Debugging: Log the token
        console.log("Stored Token:", localStorage.getItem("token"));
        console.log("Axios Default Token:", axios.defaults.headers.common['Authorization']);
  
        if (!user?.token) {
          toast.error("Authentication token missing.");
          return;
        }
  
        const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
        
        const response = await axios.get('/api/documents/student', { headers });
        console.log("Documents Response:", response.data); // Debugging
  
      } catch (error) {
        console.error("Error fetching documents:", error.response?.data || error);
        toast.error("Failed to load documents");
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchDocuments();
  }, [user]);
  // Define table columns
  const columns = [
    {
      name: <div className="font-bold text-[#4A5568]">ACTIVITY</div>,
      selector: (row) => (
        <div className="flex items-center">
          <div className="text-[#1C065A]">{row.activity}</div>
          {blockchainInfo[row.documentType] && (
            <div className="ml-2 tooltip" data-tip="Verified on blockchain">
              <FiShield className="text-[#3B2774]" />
              <span className="tooltiptext">Verified on blockchain</span>
            </div>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      name: <div className="font-bold text-[#4A5568]">DATE</div>,
      selector: (row) => <div className="text-[#1C065A]">{row.date}</div>,
      sortable: true,
    },
    {
      name: <div className="font-bold text-[#4A5568]">STATUS</div>,
      selector: (row) => (
        <div
          className={`${
            row.status === "Approved"
              ? "text-green-600"
              : row.status === "Pending"
              ? "text-yellow-500"
              : "text-red-600"
          } font-semibold`}
        >
          {row.status}
        </div>
      ),
      sortable: true,
    },
    {
      name: <div className="font-bold text-[#4A5568]">BLOCKCHAIN</div>,
      cell: (row) => (
        <div>
          {blockchainInfo[row.documentType] ? (
            <div className="flex items-center">
              <span className="bg-purple-100 text-[#3B2774] px-2 py-1 rounded-full text-xs font-semibold">
                Verified
              </span>
              <button 
                className="ml-2 text-gray-500 hover:text-[#3B2774]"
                onClick={() => {
                  toast((t) => (
                    <span>
                      <div className="font-bold">Blockchain Information</div>
                      <div className="text-xs mt-1">
                        <div><strong>Document Hash:</strong> {blockchainInfo[row.documentType].hash?.substring(0, 15)}...</div>
                        {blockchainInfo[row.documentType].blockNumber && 
                          <div><strong>Block:</strong> {blockchainInfo[row.documentType].blockNumber}</div>
                        }
                        <div><strong>Status:</strong> {blockchainInfo[row.documentType].status || "pending"}</div>
                      </div>
                      <button 
                        className="bg-[#3B2774] text-white px-2 py-1 rounded mt-2 text-xs"
                        onClick={() => toast.dismiss(t.id)}
                      >
                        Close
                      </button>
                    </span>
                  ));
                }}
              >
                <FiInfo />
              </button>
            </div>
          ) : (
            <span className="text-gray-400 text-sm">Not verified</span>
          )}
        </div>
      ),
    },
    {
      name: <div className="font-bold text-[#4A5568]">ACTIONS</div>,
      cell: (row) => (
        <div className="flex">
          <Link 
            to={`/student/document/${row.id}`} 
            className="text-[#1E3A8A] hover:underline text-sm flex items-center"
          >
            View
            <IoIosArrowForward className="ml-1" />
          </Link>
          {blockchainInfo[row.documentType] && (
            <Link 
              to="/student/blockchain-verified" 
              className="ml-4 text-[#3B2774] hover:underline text-sm flex items-center"
            >
              Verify
              <IoIosArrowForward className="ml-1" />
            </Link>
          )}
        </div>
      ),
    },
  ];

  // Add custom CSS for tooltips
  const customStyles = {
    headRow: {
      style: {
        backgroundColor: "#fff",
        color: "white",
        fontWeight: "bold",
      },
    },
    rows: {
      style: {
        fontSize: "14px",
      },
    },
  };

  return (
    <div className="p-6">
      <Toaster position="top-right" />
      
      <style>
        {`
          .tooltip {
            position: relative;
            display: inline-block;
            cursor: pointer;
          }
          
          .tooltip .tooltiptext {
            visibility: hidden;
            width: 140px;
            background-color: #3B2774;
            color: white;
            text-align: center;
            border-radius: 6px;
            padding: 5px;
            position: absolute;
            z-index: 1;
            bottom: 125%;
            left: 50%;
            margin-left: -70px;
            opacity: 0;
            transition: opacity 0.3s;
            font-size: 12px;
          }
          
          .tooltip .tooltiptext::after {
            content: "";
            position: absolute;
            top: 100%;
            left: 50%;
            margin-left: -5px;
            border-width: 5px;
            border-style: solid;
            border-color: #3B2774 transparent transparent transparent;
          }
          
          .tooltip:hover .tooltiptext {
            visibility: visible;
            opacity: 1;
          }
        `}
      </style>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3B2774]"></div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={documents}
          pagination
          highlightOnHover
          striped
          progressPending={isLoading}
          noDataComponent={
            <div className="flex flex-col items-center justify-center p-6">
              <p className="text-gray-500">No documents found</p>
              <Link to="/student/upload" className="mt-2 text-[#3B2774]">
                Upload your first document
              </Link>
            </div>
          }
          customStyles={customStyles}
        />
      )}
    </div>
  );
};

export default Documents;