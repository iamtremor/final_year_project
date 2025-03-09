import React from "react";
import { FaUsers } from "react-icons/fa";
import { AiOutlineClockCircle, AiOutlineBarChart } from "react-icons/ai";
import { HiOutlineDocumentSearch } from "react-icons/hi";
import { IoMdNotificationsOutline } from "react-icons/io";

const AdminDashboard = () => {
  return (
    <div className="p-6">
      {/* Header */}
      <h2 className="text-2xl font-bold text-[#0D0637] mb-6">
        Admin Dashboard
      </h2>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[#1E3A8A] shadow-lg rounded-lg p-12 flex items-center">
          <FaUsers size={30} className="text-[#C3A135] mr-4" />
          <div>
            <h3 className="text-lg font-bold text-white">Total Users</h3>
            <p className="text-gray-300">1,250</p>
          </div>
        </div>
        <div className="bg-[#1E3A8A] shadow-lg rounded-lg p-10 flex items-center">
          <AiOutlineClockCircle size={30} className="text-[#C3A135] mr-4" />
          <div>
            <h3 className="text-lg font-bold text-white">Pending Approvals</h3>
            <p className="text-gray-300">23 Documents</p>
          </div>
        </div>
        <div className="bg-[#1E3A8A] shadow-lg rounded-lg p-12 flex items-center">
          <HiOutlineDocumentSearch size={30} className="text-[#C3A135] mr-4" />
          <div>
            <h3 className="text-lg font-bold text-white">Active Submissions</h3>
            <p className="text-gray-300">178 Files</p>
          </div>
        </div>
        <div className="bg-[#1E3A8A] shadow-lg rounded-lg p-4 flex items-center">
          <IoMdNotificationsOutline size={30} className="text-[#C3A135] mr-4" />
          <div>
            <h3 className="text-lg font-bold text-white">
              System Notifications
            </h3>
            <p className="text-gray-300">5 New Alerts</p>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <h3 className="text-xl font-bold text-[#0D0637] mb-4">Recent Activity</h3>
      <table className="table-auto w-full border-collapse border border-gray-300 mb-6">
        <thead className="bg-[#C3A135] text-white">
          <tr>
            <th className="px-4 py-2 text-left">Student Name</th>
            <th className="px-4 py-2 text-left">Document</th>
            <th className="px-4 py-2 text-left">Status</th>
            <th className="px-4 py-2 text-left">Date</th>
          </tr>
        </thead>
        <tbody>
          <tr className="odd:bg-gray-100 even:bg-white">
            <td className="px-4 py-2">John Doe</td>
            <td className="px-4 py-2">Transcript</td>
            <td className="px-4 py-2 text-yellow-600 font-bold">Pending</td>
            <td className="px-4 py-2">Jan 10, 2025</td>
          </tr>
        </tbody>
      </table>

      {/* Notifications Panel */}
      <h3 className="text-xl font-bold text-[#0D0637] mb-4">
        System Notifications
      </h3>
      <div className="bg-white shadow-lg rounded-lg p-4">
        <p className="text-gray-600">
          🚀 Enrollment deadline extended - Jan 5, 2025
        </p>
        <p className="text-gray-600">
          ⚠️ Document submission required - Jan 4, 2025
        </p>
      </div>
    </div>
  );
};

export default AdminDashboard;
