import React from "react";
import DataTable from "react-data-table-component";
import { AiOutlineClockCircle } from "react-icons/ai";

const PendingDocuments = () => {
  // Define table columns
  const columns = [
    {
      name: <div className="font-bold text-[#4A5568]">DOCUMENT NAME</div>,
      selector: (row) => <div className="text-[#1C065A]">{row.name}</div>,
    },
    {
      name: <div className="font-bold text-[#4A5568]">SUBMISSION DATE</div>,
      selector: (row) => (
        <div className="text-[#1C065A]">{row.submissionDate}</div>
      ),
    },
    {
      name: <div className="font-bold text-[#4A5568]">STATUS</div>,
      selector: (row) => (
        <div
          className={`px-3 py-1 rounded-full text-sm font-semibold ${
            row.status === "Pending"
              ? "bg-yellow-100 text-yellow-600"
              : "bg-blue-100 text-blue-600"
          }`}
        >
          {row.status}
        </div>
      ),
    },
    {
      name: <div className="font-bold text-[#4A5568]">PROCESSING TIME</div>,
      selector: (row) => (
        <div className="text-gray-600">{row.processingTime}</div>
      ),
    },
    {
      name: <div className="font-bold text-[#4A5568]">ACTIONS</div>,
      selector: (row) => (
        <div>
          <button className="text-blue-500 hover:text-blue-700 mr-2">
            Re-upload
          </button>
          <button className="text-red-500 hover:text-red-700">Remove</button>
        </div>
      ),
    },
  ];

  // Define table data
  const data = [
    {
      id: 1,
      name: "Medical Report",
      submissionDate: "2025-01-06",
      status: "In Review",
      processingTime: "3 days remaining",
    },
    {
      id: 2,
      name: "Admission Letter",
      submissionDate: "2025-01-05",
      status: "Pending",
      processingTime: "5 days remaining",
    },
    {
      id: 3,
      name: "Transcript",
      submissionDate: "2025-01-04",
      status: "In Review",
      processingTime: "2 days remaining",
    },
  ];

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex items-center mb-4">
        <AiOutlineClockCircle size={30} className="text-[#C3A135] mr-2" />
        <h2 className="text-2xl font-bold text-[#1E3A8A]">Pending Documents</h2>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={data}
        pagination
        highlightOnHover
        striped
        customStyles={{
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
        }}
      />
    </div>
  );
};

export default PendingDocuments;