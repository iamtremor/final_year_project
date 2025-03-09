import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiFileText, FiCheckCircle, FiClock, FiShield } from "react-icons/fi";
import { IoIosArrowForward } from "react-icons/io";
import { MdOutlineSpaceDashboard } from "react-icons/md";
import Documents from "./Documents";
import axios from "axios";
import { useAuth } from "../../../../context/AuthContext";
import toast, { Toaster } from "react-hot-toast";

const Dashboard = () => {
  const { user } = useAuth();
  const [documentStats, setDocumentStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    onBlockchain: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isWithinDeadline, setIsWithinDeadline] = useState(true);

  useEffect(() => {
    const fetchDocumentStats = async () => {
      try {
        setIsLoading(true);
        
        // Get all documents for the student
        const response = await axios.get('/api/documents/student');
        
        // Calculate stats
        const docs = response.data;
        const approved = docs.filter(doc => doc.status === 'approved').length;
        const pending = docs.filter(doc => doc.status === 'pending').length;
        
        // Get blockchain verified documents
        const blockchainResponse = await axios.get(`/api/blockchain/student-documents/${user.applicationId}`);
        const blockchainDocs = blockchainResponse.data.documents || [];
        
        setDocumentStats({
          total: docs.length,
          approved,
          pending,
          onBlockchain: blockchainDocs.length
        });
        
        // Check deadline
        if (user?.applicationId) {
          const deadlineResponse = await axios.get(
            `/api/blockchain/applications/within-deadline/${user.applicationId}`
          );
          setIsWithinDeadline(deadlineResponse.data.isWithinDeadline);
        }
      } catch (error) {
        console.error("Error fetching document stats:", error);
        // Set some default values if there's an error
        setDocumentStats({
          total: 0,
          approved: 0,
          pending: 0,
          onBlockchain: 0
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchDocumentStats();
    }
  }, [user]);

  const styling = (
    bgColor,
    textColor,
    title,
    count,
    Icon,
    border = "",
    link,
    linkName
  ) => {
    return (
      <div className=" ">
        <div
          className="w-auto px-4 md:px-5 py-8 h-full flex justify-between items-center"
          style={{
            borderRadius: "4px",
            boxShadow: "0px 3px 12px 0px rgba(197, 197, 197, 0.25)",
            backgroundColor: bgColor,
            border: border,
          }}
        >
          <div>
            <h3
              className="font-light"
              style={{
                color: textColor,
                fontSize: "14px",
                lineHeight: "24px",
              }}
            >
              {title}
            </h3>
            {isLoading ? (
              <div className="animate-pulse h-8 w-8 bg-gray-300 rounded my-2"></div>
            ) : (
              <p
                className="font-bold pt-2"
                style={{
                  color: textColor,
                  fontSize: "32px",
                }}
              >
                {count}
              </p>
            )}

            <Link
              to={link}
              className=" text-[12px] flex items-center underline"
              style={{ color: textColor }}
            >
              {" "}
              {linkName}
              <IoIosArrowForward
                className="ml-1 text-white"
                style={{ color: textColor }}
              />
            </Link>
          </div>
          <Icon className="text-[39px]" style={{ color: textColor }} />
        </div>
      </div>
    );
  };

  return (
    <div
      style={{ backgroundColor: "#F6F6F6" }}
      className="w-full h-full overflow-auto "
    >
      <Toaster position="top-right" />
      <div className="text-2xl font-bold text-[#1E3A8A] mx-6 flex items-center">
        <MdOutlineSpaceDashboard />
        <h2 className="m-2">Dashboard</h2>
      </div>
      
      {!isWithinDeadline && (
        <div className="mx-5 mb-4 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
          <p className="font-bold">Document submission deadline has passed!</p>
          <p className="text-sm">You can no longer submit new documents. Contact administration if you need assistance.</p>
        </div>
      )}
      
      {/* Document Overview Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 pb-7 px-5">
        {styling(
          "#1E3A8A",
          "#FFF",
          "Documents Submitted",
          documentStats.total,
          FiFileText,
          "1px solid #FFF",
          "/student/my-documents",
          "My Documents"
        )}
        {styling(
          "#C3A135",
          "#FFF",
          "Documents Approved",
          documentStats.approved,
          FiCheckCircle,
          "1px solid #FFF",
          "/student/approved",
          "Approved Documents"
        )}
        {styling(
          "#FFF",
          "#4A5568",
          "Pending Documents",
          documentStats.pending,
          FiClock,
          "1px solid #FFF",
          "/student/pending",
          "Pending Documents"
        )}
        {styling(
          "#3B2774",
          "#FFF",
          "Blockchain Verified",
          documentStats.onBlockchain,
          FiShield,
          "1px solid #FFF",
          "/student/blockchain-verified",
          "Verified Documents"
        )}
      </div>
      
      {/* Blockchain Status Card */}
      <div className="mx-5 mb-4 p-4 bg-white rounded-md shadow-sm">
        <h2 className="text-lg font-medium text-[#1E3A8A] mb-2">Blockchain Verification Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded border">
            <div className="flex items-center mb-2">
              <FiShield className="text-[#3B2774] mr-2" />
              <h3 className="font-medium">Document Security</h3>
            </div>
            <p className="text-sm text-gray-600">
              Your documents are securely hashed and stored on the blockchain, providing tamper-proof verification.
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded border">
            <div className="flex items-center mb-2">
              <FiClock className="text-[#C3A135] mr-2" />
              <h3 className="font-medium">Submission Status</h3>
            </div>
            <p className="text-sm text-gray-600">
              {isWithinDeadline 
                ? "Document submission is currently open. Upload your documents before the deadline."
                : "Document submission is closed. The deadline has passed."}
            </p>
          </div>
        </div>
      </div>

      <Link className="flex items-center mb-3 mx-7" to="/student/my-documents">
        <h2 className="text-lg font-medium text-[#1E3A8A]">My Documents</h2>
        <IoIosArrowForward className="ml-1 text-black" />
      </Link>
      <Documents />
    </div>
  );
};

export default Dashboard;