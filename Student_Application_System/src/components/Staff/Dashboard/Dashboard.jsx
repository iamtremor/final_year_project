import React from "react";
import { Link } from "react-router-dom";
import { FaTasks, FaCheckCircle, FaTimesCircle, FaBell } from "react-icons/fa";
import { MdOutlineSpaceDashboard } from "react-icons/md";

const Dashboard = () => {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <MdOutlineSpaceDashboard size={30} className="text-[#0D0637] mr-2" />
        <h2 className="text-2xl font-bold text-[#0D0637]">Staff Dashboard</h2>
      </div>

      {/* Cards for Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pending Approvals Card */}
        <Link
          to="/staff/pending-approvals"
          className="bg-yellow-100 p-6 rounded-md shadow-md flex items-center justify-between hover:bg-yellow-200 transition"
        >
          <div>
            <h3 className="text-lg font-semibold text-yellow-800">
              Pending Approvals
            </h3>
            <p className="text-sm text-yellow-600">
              Documents awaiting your review
            </p>
          </div>
          <FaTasks size={30} className="text-yellow-600" />
        </Link>

        {/* Approved Documents Card */}
        <Link
          to="/staff/approved"
          className="bg-green-100 p-6 rounded-md shadow-md flex items-center justify-between hover:bg-green-200 transition"
        >
          <div>
            <h3 className="text-lg font-semibold text-green-800">
              Approved Documents
            </h3>
            <p className="text-sm text-green-600">
              Documents you have approved
            </p>
          </div>
          <FaCheckCircle size={30} className="text-green-600" />
        </Link>

        {/* Rejected Documents Card */}
        <Link
          to="/staff/rejected"
          className="bg-red-100 p-6 rounded-md shadow-md flex items-center justify-between hover:bg-red-200 transition"
        >
          <div>
            <h3 className="text-lg font-semibold text-red-800">
              Rejected Documents
            </h3>
            <p className="text-sm text-red-600">Documents you have rejected</p>
          </div>
          <FaTimesCircle size={30} className="text-red-600" />
        </Link>
      </div>

      {/* Recent Activity Section */}
      <div className="mt-8">
        <h3 className="text-lg font-bold text-[#0D0637]">Recent Activity</h3>
        <ul className="mt-4 bg-white shadow-md rounded-md p-4">
          <li className="border-b p-2 text-sm text-gray-600 flex justify-between">
            <span>Approved WAEC Result for John Doe</span>
            <span className="text-green-500">Approved</span>
          </li>
          <li className="border-b p-2 text-sm text-gray-600 flex justify-between">
            <span>Rejected Birth Certificate for Adesuwa Angela</span>
            <span className="text-red-500">Rejected</span>
          </li>
          <li className="p-2 text-sm text-gray-600 flex justify-between">
            <span>Pending review of JAMB Result for Jane Smith</span>
            <span className="text-yellow-500">Pending</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
