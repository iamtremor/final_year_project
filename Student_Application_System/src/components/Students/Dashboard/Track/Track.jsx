import React from "react";
import { MdTrackChanges } from "react-icons/md";

const TrackStatus = () => {
  // Sample data for document tracking
  const documents = [
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
  ];

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex items-center mb-4">
        <div className="text-2xl font-bold text-[#1E3A8A]  flex items-center">
          <MdTrackChanges size={30} className="text-[#C3A135] mr-2" />
          <h2 className="mx-2">Track Document Status</h2>
        </div>
      </div>

      {/* Table */}
      <table className="table-auto w-full border-collapse border border-gray-300">
        {/* Table Header */}
        <thead className="bg-[#C3A135] text-white">
          <tr>
            <th className="px-4 py-2 text-left">Document Name</th>
            <th className="px-4 py-2 text-left">Status</th>
            <th className="px-4 py-2 text-left">Progress</th>
            <th className="px-4 py-2 text-left">Last Updated</th>
            <th className="px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody>
          {documents.map((doc) => (
            <tr key={doc.id} className="odd:bg-gray-100 even:bg-white">
              <td className="px-4 py-2">{doc.name}</td>
              <td className="px-4 py-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    doc.status === "Approved"
                      ? "bg-green-100 text-green-600"
                      : doc.status === "Under Review"
                      ? "bg-yellow-100 text-yellow-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {doc.status}
                </span>
              </td>
              <td className="px-4 py-2">
                <div className="relative w-full bg-gray-200 h-2 rounded">
                  <div
                    className="absolute top-0 left-0 h-2 rounded bg-[#C3A135]"
                    style={{ width: `${doc.progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {doc.progress}% Completed
                </p>
              </td>
              <td className="px-4 py-2 text-gray-600">{doc.lastUpdated}</td>
              <td className="px-4 py-2">
                <button className="text-blue-500 hover:text-blue-700">
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TrackStatus;
