import React from "react";
import { FaSearch, FaEnvelope, FaEye } from "react-icons/fa";

const TrackApp = () => {
  const applications = [
    {
      id: 1,
      studentName: "Angela Aiwerioghene",
      appId: "APP00123",
      submittedOn: "Jan 10, 2025",
      status: "In Review",
    },
    {
      id: 2,
      studentName: "John Doe",
      appId: "APP00124",
      submittedOn: "Jan 5, 2025",
      status: "Approved",
    },
    {
      id: 3,
      studentName: "Sarah Johnson",
      appId: "APP00125",
      submittedOn: "Dec 30, 2024",
      status: "Rejected",
    },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-[#0D0637] mb-4">
        Track Student Applications
      </h2>
      {/* Applications Table */}

      <table className="table-auto w-full border-collapse border border-gray-300">
        <thead className="bg-[#C3A135] text-white">
          <tr>
            <th className="px-4 py-2 text-left">Student Name</th>
            <th className="px-4 py-2 text-left">Application ID</th>
            <th className="px-4 py-2 text-left">Submitted On</th>
            <th className="px-4 py-2 text-left">Status</th>
            <th className="px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>

        <tbody>
          {applications.map((app) => (
            <tr key={app.id} className="odd:bg-gray-100 even:bg-white">
              <td className="px-4 py-2 font-semibold">{app.studentName}</td>
              <td className="px-4 py-2">{app.appId}</td>
              <td className="px-4 py-2">{app.submittedOn}</td>

              <td className="px-4 py-2">
                <span
                  className={`px-2 py-1 rounded-full text-sm font-semibold ${
                    app.status === "Approved"
                      ? "bg-green-100 text-green-600"
                      : app.status === "In Review"
                      ? "bg-yellow-100 text-yellow-600"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {app.status}
                </span>
              </td>

              <td className="px-4 py-2 flex space-x-2">
                <button className="text-blue-500 hover:text-blue-700 flex items-center">
                  <FaEye className="mr-1" /> View
                </button>

                {app.status !== "Approved" && (
                  <button className="text-purple-500 hover:text-purple-700 flex items-center">
                    <FaEnvelope className="mr-1" /> Feedback
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TrackApp;
