import React from "react";
import DataTable from "react-data-table-component";
import { MdTrackChanges } from "react-icons/md";

const TrackStatus = () => {
  // Define table columns
  const columns = [
    {
      name: <div className="font-bold text-[#4A5568]">DOCUMENT NAME</div>,
      selector: (row) => <div className="text-[#1C065A]">{row.name}</div>,
    },
    {
      name: <div className="font-bold text-[#4A5568]">STATUS</div>,
      selector: (row) => (
        <div
          className={`px-3 py-1 rounded-full text-sm font-semibold ${
            row.status === "Approved"
              ? "bg-green-100 text-green-600"
              : row.status === "Under Review"
              ? "bg-yellow-100 text-yellow-600"
              : row.status === "Submitted"
              ? "bg-gray-100 text-gray-600"
              : "bg-red-100 text-red-600"
          }`}
        >
          {row.status}
        </div>
      ),
    },
    {
      name: <div className="font-bold text-[#4A5568]">PROGRESS</div>,
      selector: (row) => (
        <div className="w-full">
          <div className="relative w-full bg-gray-200 h-2 rounded">
            <div
              className="absolute top-0 left-0 h-2 rounded bg-[#C3A135]"
              style={{ width: `${row.progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {row.progress}% Completed
          </p>
        </div>
      ),
    },
    {
      name: <div className="font-bold text-[#4A5568]">LAST UPDATED</div>,
      selector: (row) => <div className="text-gray-600">{row.lastUpdated}</div>,
    },
    {
      name: <div className="font-bold text-[#4A5568]">ACTIONS</div>,
      selector: (row) => (
        <div>
          {row.status === "Approved" && (
            <button className="text-blue-500 hover:text-blue-700">
              View Document
            </button>
          )}
          {row.status === "Declined" && (
            <>
              <button className="text-red-500 hover:text-red-700 mr-2">
                View Comments
              </button>
              <button className="text-[#C3A135] hover:text-yellow-600">
                Re-Upload
              </button>
            </>
          )}
          {row.status === "Under Review" && (
            <p className="text-gray-500 text-sm">Waiting for review...</p>
          )}
        </div>
      ),
    },
  ];

  // Define table data
  const data = [
    {
      id: 1,
      name: "Transcript",
      status: "Under Review",
      progress: 50,
      lastUpdated: "Jan 5, 2025",
    },
    {
      id: 2,
      name: "Admission Letter",
      status: "Approved",
      progress: 100,
      lastUpdated: "Jan 4, 2025",
    },
    {
      id: 3,
      name: "Medical Report",
      status: "Submitted",
      progress: 25,
      lastUpdated: "Jan 3, 2025",
    },
    {
      id: 4,
      name: "WAEC Result",
      status: "Declined",
      progress: 0,
      lastUpdated: "Jan 2, 2025",
      reason: "Low-quality scan. Please re-upload a clearer version.",
    },
  ];

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex items-center mb-4">
        <MdTrackChanges size={30} className="text-[#C3A135] mr-2" />
        <h2 className="text-2xl font-bold text-[#1E3A8A]">
          Track Document Status
        </h2>
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

export default TrackStatus;