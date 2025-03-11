import React from "react";
import DataTable from "react-data-table-component";
import { IoIosArrowForward } from "react-icons/io";
import { Link } from "react-router-dom";
const RecentActivity = () => {
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
  ];

  // Define table data
  const data = [
    {
      id: 1,
      activity: "Transcript",
      date: "2025-01-07",
      status: "Approved",
    },
    {
      id: 2,
      activity: "Admission Letter Uploaded",
      date: "2025-01-06",
      status: "Pending",
    },
    {
      id: 3,
      activity: "Medical Report ",
      date: "2025-01-05",
      status: "Rejected",
    },

    {
      id: 4,
      activity: "Transcript ",
      date: "2025-01-03",
      status: "Approved",
    },
    {
      id: 5,
      activity: "WAEC Result ",
      date: "2025-01-03",
      status: "Approved",
    },
    {
      id: 6,
      activity: "JAMB Result",
      date: "2025-01-03",
      status: "Rejected",
    },
    {
      id: 3,
      activity: "Medical Report ",
      date: "2025-01-05",
      status: "Rejected",
    },

    {
      id: 4,
      activity: "Transcript ",
      date: "2025-01-03",
      status: "Approved",
    },
  ];

  return (
    <div className="p">
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

export default RecentActivity;
