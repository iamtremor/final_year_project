import React, { useState } from "react";
import DataTable from "react-data-table-component";
import { AiOutlineEye, AiOutlineDownload } from "react-icons/ai";
import { MdCheckCircle } from "react-icons/md";

// Sample Approved Documents Data
const approvedDocuments = [
  {
    id: 1,
    studentName: "Adesuwa Angela",
    matricNo: "BU/22/1234",
    documentName: "WAEC Result",
    approvedBy: "Mr. Soji",
    approvalDate: "Feb 20, 2025",
    documentUrl: "https://waec.pdf",
  },
  {
    id: 2,
    studentName: "John Doe",
    matricNo: "BU/22/5678",
    documentName: "Birth Certificate",
    approvedBy: "Mrs. Akin",
    approvalDate: "Feb 18, 2025",
    documentUrl: "https://example.com/birth.pdf",
  },
];

// Modal Component
const Modal = ({ show, onClose, document }) => {
  if (!show || !document) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-md shadow-lg max-w-lg w-full">
        <h3 className="text-lg font-bold mb-2">{document.documentName}</h3>

        <p className="text-sm text-gray-500">
          Approved By: {document.approvedBy}
        </p>

        <p className="text-sm text-green-500">
          Approval Date: {document.approvalDate}
        </p>
        {/* Embedded PDF/Iframe Viewer */}

        <div className="mt-4">
          <iframe
            src={document.documentUrl}
            className="w-full h-64 border"
            title="Document Preview"
          />
        </div>
        {/* Modal Actions */}

        <div className="mt-4 flex justify-between">
          <button
            className="bg-gray-300 px-4 py-2 rounded-md"
            onClick={onClose}
          >
            Close
          </button>

          <a
            href={document.documentUrl}
            download
            className="bg-[#C3A135] text-white px-4 py-2 rounded-md"
          >
            Download
          </a>
        </div>
      </div>
    </div>
  );
};

const ApprovedDocuments = () => {
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showModal, setShowModal] = useState(false); // Open modal to view document

  const handleViewDocument = (doc) => {
    setSelectedDocument(doc);
    setShowModal(true);
  }; // Table Columns

  const columns = [
    {
      name: "Student Name",
      selector: (row) => row.studentName,
      sortable: true,
    },
    {
      name: "Matric No",
      selector: (row) => row.matricNo,
      sortable: true,
    },
    {
      name: "Document Name",
      selector: (row) => row.documentName,
      sortable: true,
    },
    {
      name: "Approved By",
      selector: (row) => row.approvedBy,
      sortable: true,
    },
    {
      name: "Approval Date",
      selector: (row) => row.approvalDate,
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex space-x-2">
          {/* View Document Button */}

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
      {/* Header */}

      <div className="flex items-center mb-4">
        <MdCheckCircle size={30} className="text-green-600 mr-2" />

        <h2 className="text-2xl font-bold text-[#0D0637]">
          Approved Documents
        </h2>
      </div>
      {/* React Data Table */}

      <DataTable
        columns={columns}
        data={approvedDocuments}
        pagination
        highlightOnHover
        responsive
        striped
        className="shadow-lg rounded-lg"
      />
      {/* Modal Component */}

      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        document={selectedDocument}
      />
    </div>
  );
};

export default ApprovedDocuments;
