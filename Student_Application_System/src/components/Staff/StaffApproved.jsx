import React, { useState } from "react";
import DataTable from "react-data-table-component";
import { AiOutlineEye, AiOutlineDownload } from "react-icons/ai";
import { MdCheckCircle } from "react-icons/md";

const approvedDocuments = [
  {
    id: 1,
    studentName: "Adesuwa Angela",
    matricNo: "BU/22/1234",
    documentName: "WAEC Result",
    approvedBy: "Mr. Soji",
    approvalDate: "Feb 20, 2025",
    documentUrl:
      "https://en.wikipedia.org/wiki/West_African_Examinations_Council",
  },
  {
    id: 2,
    studentName: "Timothy Dike",
    matricNo: "BU/22/5678",
    documentName: "Birth Certificate",
    approvedBy: "Mr. Seun",
    approvalDate: "Feb 18, 2025",
    documentUrl: "https://example.com/birth.pdf",
  },
  {
    id: 3,
    studentName: "Nimi Timi",
    matricNo: "BU/22/5893",
    documentName: "JAMB Result",
    approvedBy: "Mrs. Akande",
    approvalDate: "Feb 28, 2025",
    documentUrl: "https://www.victoriafilmfestival.com/product/flow/",
  },
  {
    id: 4,
    studentName: "Mosun King",
    matricNo: "BU/22/5893",
    documentName: "WAEC Result",
    approvedBy: "Mrs. Oyebold",
    approvalDate: "March 28, 2025",
    documentUrl: "https://www.pinterest.com/pin/412501647104111073/",
  },
  {
    id: 5,
    studentName: "Dayo Bolu",
    matricNo: "BU/22/1244",
    documentName: "JAMB Result",
    approvedBy: "Mrs. Akande",
    approvalDate: "Feb 28, 2025",
    documentUrl: "https://www.victoriafilmfestival.com/product/flow/",
  },
  {
    id: 6,
    studentName: "Sola Damarrae",
    matricNo: "BU/22/6735",
    documentName: "Admission Result",
    approvedBy: "Mrs. Suliate",
    approvalDate: "Feb 28, 2025",
    documentUrl: "https://lionking.fandom.com/wiki/Simba",
  },
];

const StaffApproved = () => {
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
    { name: "Approved By", selector: (row) => row.approvedBy, sortable: true },
    {
      name: "Approval Date",
      selector: (row) => row.approvalDate,
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex">
          <button
            className="text-blue-500 hover:text-blue-700 flex items-center"
            onClick={() => handleViewDocument(row)}
          >
            View
          </button>

          <a
            href={row.documentUrl}
            download
            className="text-green-500 hover:text-green-700 flex ml-1 items-center"
          >
            Download
          </a>
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
        <MdCheckCircle size={30} className="text-green-600 mr-2" />

        <h2 className="text-2xl font-bold text-[#0D0637]">
          Approved Documents
        </h2>
      </div>

      <DataTable
        columns={columns}
        data={approvedDocuments}
        pagination
        highlightOnHover
        responsive
        striped
        className="shadow-lg rounded-lg"
      />
      {/* View Document Modal */}

      {showModal && selectedDocument && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-md shadow-lg max-w-lg w-full">
            <h3 className="text-lg font-bold mb-2">
              {selectedDocument.documentName}
            </h3>

            <p className="text-sm text-gray-500">
              Approved By: {selectedDocument.approvedBy}
            </p>

            <p className="text-sm text-green-500">
              Approval Date: {selectedDocument.approvalDate}
            </p>

            <div className="mt-4">
              <iframe
                src={selectedDocument.documentUrl}
                className="w-full h-64 border"
                title="Document Preview"
              />
            </div>

            <div className="mt-4 flex justify-between">
              <button
                className="bg-gray-300 px-4 py-2 rounded-md"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffApproved;
