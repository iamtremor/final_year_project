import React, { useState } from "react";
import DataTable from "react-data-table-component";
import { AiOutlineEye, AiOutlineReload } from "react-icons/ai";
import { MdOutlineError } from "react-icons/md";

const rejectedDocuments = [
  {
    id: 1,
    studentName: "Adesuwa Angela",
    matricNo: "BU/22/1234",
    documentName: "WAEC Result",
    rejectedBy: "Mr. Soji",
    rejectionDate: "Feb 20, 2025",
    reason: "Low-quality scan. Please upload a clearer version.",
    documentUrl:
      "https://en.wikipedia.org/wiki/West_African_Examinations_Council",
  },
  {
    id: 2,
    studentName: "Kayode Sheriff",
    matricNo: "BU/22/9736",
    documentName: "Birth Certificate",
    rejectedBy: "Prof. King",
    rejectionDate: "Feb 18, 2025",
    reason: "Incomplete information on the document.",
    documentUrl:
      "https://en.wikipedia.org/wiki/West_African_Examinations_Council",
  },
  {
    id: 3,
    studentName: "Bolu Sergio",
    matricNo: "BU/22/1368",
    documentName: "Birth Certificate",
    rejectedBy: "Mr. Emmanuel",
    rejectionDate: "Feb 18, 2025",
    reason: "Do better G.",
    documentUrl:
      "https://en.wikipedia.org/wiki/West_African_Examinations_Council",
  },
  {
    id: 4,
    studentName: "Sharon Bae",
    matricNo: "BU/22/9870",
    documentName: "Birth Certificate",
    rejectedBy: "Mrs. Lola",
    rejectionDate: "Feb 18, 2025",
    reason: "You are too young.",
    documentUrl:
      "https://en.wikipedia.org/wiki/West_African_Examinations_Council",
  },
  {
    id: 5,
    studentName: "Daysuwa Similola",
    matricNo: "BU/22/2345",
    documentName: "Birth Certificate",
    rejectedBy: "Mrs. Similola",
    rejectionDate: "Feb 18, 2025",
    reason: "Send a better image.",
    documentUrl:
      "https://en.wikipedia.org/wiki/West_African_Examinations_Council",
  },
];

const StaffRejected = () => {
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleViewDocument = (doc) => {
    setSelectedDocument(doc);
    setShowModal(true);
  };

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
    { name: "Rejected By", selector: (row) => row.rejectedBy, sortable: true },
    {
      name: "Rejection Date",
      selector: (row) => row.rejectionDate,
      sortable: true,
    },
    { name: "Rejection Reason", selector: (row) => row.reason, wrap: true },
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
                
        <MdOutlineError size={30} className="text-red-600 mr-2" />
                
        <h2 className="text-2xl font-bold text-[#0D0637]">
          Rejected Documents
        </h2>
              
      </div>
            
      <DataTable
        columns={columns}
        data={rejectedDocuments}
        pagination
        highlightOnHover
        responsive
        striped
        className="shadow-lg rounded-lg"
      />
            
      {showModal && selectedDocument && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    
          <div className="bg-white p-6 rounded-md shadow-lg max-w-lg w-full">
                        
            <h3 className="text-lg font-bold mb-2">
              {selectedDocument.documentName}
            </h3>
                        
            <p className="text-sm text-gray-500">
              Rejected By: {selectedDocument.rejectedBy}
            </p>
                        
            <p className="text-sm text-red-500">
              Reason: {selectedDocument.reason}
            </p>
                        
            <iframe
              src={selectedDocument.documentUrl}
              className="w-full h-64 border"
              title="Document Preview"
            />
                        
            <button
              className="bg-gray-300 px-4 py-2 rounded-md mt-4"
              onClick={() => setShowModal(false)}
            >
              Close
            </button>
                      
          </div>
                  
        </div>
      )}
          
    </div>
  );
};

export default StaffRejected;
