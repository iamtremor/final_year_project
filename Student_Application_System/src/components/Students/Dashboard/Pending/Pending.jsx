// import React from "react";
// import DataTable from "react-data-table-component";

// const Pending = () => {
//   // Define table columns
//   const columns = [
//     {
//       name: <div className="font-bold text-[#4A5568]">ACTIVITY</div>,
//       selector: (row) => <div className="text-[#1C065A]">{row.activity}</div>,
//     },
//     {
//       name: <div className="font-bold text-[#4A5568]">DATE</div>,
//       selector: (row) => <div className="text-[#1C065A]">{row.date}</div>,
//     },
//     {
//       name: <div className="font-bold text-[#4A5568]">STATUS</div>,
//       selector: (row) => (
//         <div
//           className={`${
//             row.status === "Approved"
//               ? "text-green-600"
//               : row.status === "In Review"
//               ? "text-yellow-500"
//               : "text-red-600"
//           } font-semibold`}
//         >
//           {row.status}
//         </div>
//       ),
//     },
//   ];

//   // Define table data
//   const data = [
//     {
//       id: 1,
//       activity: "Transcript",
//       date: "2025-01-07",
//       status: "In Review",
//     },
//     {
//       id: 2,
//       activity: "Admission Letter Uploaded",
//       date: "2025-01-06",
//       status: "In Review",
//     },
//     {
//       id: 3,
//       activity: "Medical Report ",
//       date: "2025-01-05",
//       status: "In Review",
//     },

//     {
//       id: 4,
//       activity: "Transcript ",
//       date: "2025-01-03",
//       status: "In Review",
//     },
//     {
//       id: 5,
//       activity: "WAEC Result ",
//       date: "2025-01-03",
//       status: "In Review",
//     },
//     {
//       id: 6,
//       activity: "JAMB Result",
//       date: "2025-01-03",
//       status: "In Review",
//     },
//   ];

//   return (
//     <div className=" p-6">
//       <h2 className="text-lg font-medium text-[#1E3A8A] mb-4">
//         Pending Documents
//       </h2>
//       <DataTable
//         columns={columns}
//         data={data}
//         pagination
//         highlightOnHover
//         striped
//         customStyles={{
//           headRow: {
//             style: {
//               backgroundColor: "#fff",
//               color: "white",
//               fontWeight: "bold",
//             },
//           },
//           rows: {
//             style: {
//               fontSize: "14px",
//             },
//           },
//         }}
//       />
//     </div>
//   );
// };

// export default Pending;

import React from "react";
import { AiOutlineClockCircle } from "react-icons/ai";

const PendingDocuments = () => {
  // Sample data for pending documents
  const pendingDocuments = [
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

      {/* Table */}
      <table className="table-auto w-full border-collapse border border-gray-300">
        {/* Table Header */}
        <thead className="bg-[#C3A135] text-white">
          <tr>
            <th className="px-4 py-2 text-left">Document Name</th>
            <th className="px-4 py-2 text-left">Submission Date</th>
            <th className="px-4 py-2 text-left">Status</th>
            <th className="px-4 py-2 text-left">Processing Time</th>
            <th className="px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody>
          {pendingDocuments.map((doc) => (
            <tr key={doc.id} className="odd:bg-gray-100 even:bg-white">
              <td className="px-4 py-2">{doc.name}</td>
              <td className="px-4 py-2">{doc.submissionDate}</td>
              <td className="px-4 py-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    doc.status === "Pending"
                      ? "bg-yellow-100 text-yellow-600"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  {doc.status}
                </span>
              </td>
              <td className="px-4 py-2 text-gray-600">{doc.processingTime}</td>
              <td className="px-4 py-2">
                <button className="text-blue-500 hover:text-blue-700 mr-2">
                  Re-upload
                </button>
                <button className="text-red-500 hover:text-red-700">
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PendingDocuments;
