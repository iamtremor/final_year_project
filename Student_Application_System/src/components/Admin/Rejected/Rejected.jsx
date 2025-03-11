import React, { useState } from "react";
import DataTable from "react-data-table-component";
import { AiOutlineEye, AiOutlineReload } from "react-icons/ai";
import { MdOutlineError } from "react-icons/md";

// Sample Rejected Documents Data
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
    studentName: "John Doe",
    matricNo: "BU/22/5678",
    documentName: "Birth Certificate",
    rejectedBy: "Mrs. Akin",
    rejectionDate: "Feb 18, 2025",
    reason: "Incomplete information on the document.",
    documentUrl: "https://example.com/birth.pdf",
  },
];

// Modal Component
const Modal = ({ show, onClose, document, onResubmit }) => {
  const [adminNote, setAdminNote] = useState("");

  if (!show || !document) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-md shadow-lg max-w-lg w-full">
        <h3 className=" mb-2">{document.studentName}</h3>
        <h3 className="text-lg font-bold mb-2">{document.documentName}</h3>

        <p className="text-sm text-gray-500">
          Rejected By: {document.rejectedBy}
        </p>

        <p className="text-sm text-red-500">Reason: {document.reason}</p>
        {/* Embedded PDF/Iframe Viewer */}

        <div className="mt-4">
          <iframe
            src={document.documentUrl}
            className="w-full h-64 border"
            title="Document Preview"
          />
        </div>
        {/* Resubmission Form */}

        <div className="mt-4">
          <label className="text-sm font-semibold text-gray-700">
            Admin Note (Optional)
          </label>

          <textarea
            className="w-full border p-2 mt-2 rounded-md"
            placeholder="Add a note for the student..."
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
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

          <button
            className="bg-[#C3A135] text-white px-4 py-2 rounded-md"
            onClick={() => onResubmit(document, adminNote)}
          >
            Request Resubmission
          </button>
        </div>
      </div>
    </div>
  );
};

const RejectedDocuments = () => {
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showModal, setShowModal] = useState(false); // Open modal to view document

  const handleViewDocument = (doc) => {
    setSelectedDocument(doc);
    setShowModal(true);
  }; // Request resubmission

  const handleResubmissionRequest = (doc, adminNote) => {
    alert(
      `Resubmission requested for ${doc.documentName} with note: ${
        adminNote || "No additional note"
      }`
    );
    setShowModal(false);
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
      name: "Rejected By",
      selector: (row) => row.rejectedBy,
      sortable: true,
    },
    {
      name: "Rejection Date",
      selector: (row) => row.rejectionDate,
      sortable: true,
    },
    {
      name: "Rejection Reason",
      selector: (row) => row.reason,
      wrap: true,
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
            <AiOutlineEye className="mr-1" /> View & Resubmit
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
        <MdOutlineError size={30} className="text-red-600 mr-2" />

        <h2 className="text-2xl font-bold text-[#0D0637]">
          Rejected Documents
        </h2>
      </div>
      {/* React Data Table */}

      <DataTable
        columns={columns}
        data={rejectedDocuments}
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
        onResubmit={handleResubmissionRequest}
      />
    </div>
  );
};

export default RejectedDocuments;
