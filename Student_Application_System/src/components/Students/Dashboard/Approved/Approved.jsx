import React from "react";
import DataTable from "react-data-table-component";
import { FiCheckCircle } from "react-icons/fi";
const Approved = () => {
  // Define table columns
  const columns = [
    {
      name: <div className="font-bold text-[#4A5568]">ACTIVITY</div>,
      selector: (row) => <div className="text-[#1C065A]">{row.activity}</div>,
    },
    {
      name: <div className="font-bold text-[#4A5568]">DATE</div>,
      selector: (row) => <div className="text-[#1C065A]">{row.date}</div>,
    },
    {
      name: <div className="font-bold text-[#4A5568]">STATUS</div>,
      selector: (row) => (
        <div
          className={`${
            row.status === "Approved"
              ? "text-green-600"
              : row.status === "Pending"
              ? "text-yellow-500"
              : "text-red-600"
          } font-semibold`}
        >
          {row.status}
        </div>
      ),
    },
    {
      name: <div className="font-bold text-[#4A5568]">APPROVED BY</div>,
      selector: (row) => (
        <div className="text-[#1C065A] font-bold">{row.approvedby}</div>
      ),
    },
  ];

  // Define table data
  const data = [
    {
      id: 1,
      activity: "Transcript",
      date: "2025-01-07",
      status: "Approved",
      approvedby: "Dr Olagunju",
    },
    {
      id: 2,
      activity: "Admission Letter Uploaded",
      date: "2025-01-06",
      status: "Approved",
      approvedby: "Mr Funsho",
    },
    {
      id: 3,
      activity: "Medical Report ",
      date: "2025-01-05",
      status: "Approved",
      approvedby: "Prof. Dolapo",
    },

    {
      id: 4,
      activity: "Transcript ",
      date: "2025-01-03",
      status: "Approved",
      approvedby: "Dr. Folahun",
    },
    {
      id: 5,
      activity: "WAEC Result ",
      date: "2025-01-03",
      status: "Approved",
      approvedby: "Miss Smith",
    },
    {
      id: 6,
      activity: "JAMB Result",
      date: "2025-01-03",
      status: "Approved",
      approvedby: "Mr  Louis",
    },
  ];

  return (
    <div className=" p-6">
      <div className="text-2xl font-bold text-[#1E3A8A]  flex items-center">
        <FiCheckCircle />
        <h2 className="mx-2">My Documents</h2>
      </div>
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

export default Approved;
