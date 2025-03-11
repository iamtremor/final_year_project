import React from "react";
import { FaUsers } from "react-icons/fa";
import { AiOutlineClockCircle, AiOutlineBarChart } from "react-icons/ai";
import { HiOutlineDocumentSearch } from "react-icons/hi";
import { IoMdNotificationsOutline } from "react-icons/io";
import { Link } from "react-router-dom";
import { IoIosArrowForward } from "react-icons/io";
import { FaHourglassHalf, FaRegTimesCircle } from "react-icons/fa";
import { FiCheckCircle } from "react-icons/fi";
import RecentActivity from "./RecentActivity";

const AdminDashboard = () => {
  return (
    <div className="p-6">
      {/* Header */}
      <h2 className="text-xl font-bold text-[#0D0637] mb-6 font-textFont2">
        Admin Dashboard
      </h2>

      {/* Quick Summary Cards */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6 text-white">
        <div className="bg-[#1E3A8A] shadow-lg rounded-lg p-12 flex items-center">
          <FaUsers size={30} className="text-[#C3A135] mr-4" />
          <div>
            <h3 className="text-sm font-bold">Total Users</h3>
            <p className="text-gray-300 ">1,250</p>
            <div className="flex items-center mt-3">
              <Link
                to="/admin/manage-user-user-list"
                className="block text-sm underline"
              >
                Total Users
              </Link>
              <IoIosArrowForward />
            </div>
          </div>
        </div>

        <div className="bg-[#1E3A8A] shadow-lg rounded-lg p-12 flex items-center">
          <FaRegTimesCircle size={30} className="text-[#C3A135] mr-4" />
          <div>
            <h3 className="text-sm font-bold text-white">Rejected Documents</h3>
            <p className="text-gray-300 ">23 Documents</p>
            <div className="flex items-center mt-3 ">
              <Link
                to="/admin/my-documents/rejected"
                className="block text-sm underline"
              >
                Rejected Documents
              </Link>
              <IoIosArrowForward cl />
            </div>
          </div>
        </div>
        <div className="bg-[#1E3A8A] shadow-lg rounded-lg p-12 flex items-center">
          <FiCheckCircle size={30} className="text-[#C3A135] mr-4" />
          <div>
            <h3 className="text-sm font-bold text-white">Approved Documents</h3>
            <p className="text-gray-300">178 Files</p>
            <div className="flex items-center mt-3 ">
              <Link
                to="/admin/my-documents/approved"
                className="block text-sm underline"
              >
                Approved Documents
              </Link>
              <IoIosArrowForward cl />
            </div>
          </div>
        </div>
        <div className="bg-[#1E3A8A] shadow-lg rounded-lg p-12 flex items-center">
          <IoMdNotificationsOutline size={30} className="text-[#C3A135] mr-4" />
          <div>
            <h3 className="text-sm font-bold text-white">
              System Notifications
            </h3>
            <p className="text-gray-300">5 New Alerts</p>
            <div className="flex items-center mt-3 ">
              <Link
                to="/admin/notifications"
                className="block text-sm underline"
              >
                Notifications
              </Link>
              <IoIosArrowForward cl />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <h3 className="text-xl font-bold text-[#0D0637] mb-4">Recent Activity</h3>
      {/* <table className="table-auto w-full border-collapse border border-gray-300 mb-6">
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
      </table> */}
      <RecentActivity />
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
