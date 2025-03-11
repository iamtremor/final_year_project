import React, { useState } from "react";
import DataTable from "react-data-table-component";
import { AiOutlineEye, AiOutlineCheck, AiOutlineClose } from "react-icons/ai";
import { MdPendingActions } from "react-icons/md";

// Sample Pending Documents Data
const pendingDocuments = [
  {
    id: 1,
    studentName: "Justin Bieber",
    matricNo: "BU/22/1234",
    documentName: "WAEC Result",
    submittedDate: "Feb 18, 2025",
    documentUrl:
      "https://en.wikipedia.org/wiki/West_African_Examinations_Council",
  },
  {
    id: 2,
    studentName: "Kehlani Nicki Minaj",
    matricNo: "BU/22/5678",
    documentName: "Birth Certificate",
    submittedDate: "Feb 17, 2025",
    documentUrl:
      "https://en.wikipedia.org/wiki/West_African_Examinations_Council",
  },
];

const StaffPending = () => {
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [approvalMode, setApprovalMode] = useState(""); // "approve" or "reject"
  const [comment, setComment] = useState(""); // Open modal to review document

  const handleViewDocument = (doc) => {
    setSelectedDocument(doc);
    setShowModal(true);
    setApprovalMode(""); // Reset mode
  }; // Handle approval/rejection with comment

  const handleDecision = () => {
    if (approvalMode === "reject" && !comment.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }
    alert(
      `Document ${selectedDocument.documentName} for ${
        selectedDocument.studentName
      } has been ${
        approvalMode === "approve"
          ? "approved"
          : `rejected with reason: ${comment}`
      }`
    );
    setShowModal(false);
    setComment(""); // Reset comment
  }; // Table Columns

  const columns = [
    {
      name: "Student Name",
      selector: (row) => row.studentName,
      sortable: true,
    },
    { name: "Matric No", selector: (row) => row.matricNo, sortable: true },
    {
      name: "Document Name",
      selector: (row) => row.documentName,
      sortable: true,
    },
    {
      name: "Submitted Date",
      selector: (row) => row.submittedDate,
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex space-x-2">
                    
          <button
            className="text-blue-500 hover:text-blue-700 flex items-center"
            onClick={() => handleViewDocument(row)}
          >
                        
            <AiOutlineEye className="mr-1" /> View           
          </button>
                  
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
  ];

  return (
    <div className="p-6">
            
      <div className="flex items-center mb-4">
                
        <MdPendingActions size={30} className="text-yellow-600 mr-2" />
                
        <h2 className="text-2xl font-bold text-[#0D0637]">Pending Approvals</h2>
              
      </div>
            
      <DataTable
        columns={columns}
        data={pendingDocuments}
        pagination
        highlightOnHover
        responsive
        striped
        className="shadow-lg rounded-lg"
      />
            {/* View Document & Decision Modal */}
            
      {showModal && selectedDocument && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    
          <div className="bg-white p-6 rounded-md shadow-lg max-w-lg w-full">
                        
            <h3 className="text-lg font-bold mb-2">
              {selectedDocument.documentName}
            </h3>
                        
            <p className="text-sm text-gray-500">
              Submitted By: {selectedDocument.studentName}
            </p>
                        {/* Embedded PDF/Iframe Viewer */}
                        
            <div className="mt-4">
                            
              <iframe
                src={selectedDocument.documentUrl}
                className="w-full h-64 border"
                title="Document Preview"
              />
                          
            </div>
                        {/* Approval/Rejection Actions */}
                        
            <div className="mt-4 flex justify-between">
                            
              <button
                className="bg-green-500 text-white px-4 py-2 rounded-md flex items-center"
                onClick={() => setApprovalMode("approve")}
              >
                                
                <AiOutlineCheck className="mr-1" /> Approve               
              </button>
                            
              <button
                className="bg-red-500 text-white px-4 py-2 rounded-md flex items-center"
                onClick={() => setApprovalMode("reject")}
              >
                                
                <AiOutlineClose className="mr-1" /> Reject               
              </button>
                          
            </div>
                        {/* Comment Box for Rejection */}
                        
            {approvalMode === "reject" && (
              <div className="mt-4">
                                
                <label className="text-sm font-semibold text-gray-700">
                  Rejection Reason
                </label>
                                
                <textarea
                  className="w-full border p-2 mt-2 rounded-md"
                  placeholder="Enter reason for rejection..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                              
              </div>
            )}
                        {/* Confirm Decision */}
                        
            {approvalMode && (
              <div className="mt-4 flex justify-between">
                                
                <button
                  className="bg-gray-300 px-4 py-2 rounded-md"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                                
                <button
                  className={`px-4 py-2 rounded-md ${
                    approvalMode === "approve"
                      ? "bg-green-500 text-white"
                      : "bg-red-500 text-white"
                  }`}
                  onClick={handleDecision}
                >
                                    
                  {approvalMode === "approve"
                    ? "Confirm Approval"
                    : "Confirm Rejection"}
                                  
                </button>
                              
              </div>
            )}
                      
          </div>
                  
        </div>
      )}
          
    </div>
  );
};

export default StaffPending;
