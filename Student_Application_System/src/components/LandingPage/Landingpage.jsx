import React from "react";
import { useNavigate } from "react-router-dom";
import { PiStudent } from "react-icons/pi";
import { GoBriefcase } from "react-icons/go";
import { MdOutlineBadge } from "react-icons/md";
import { FaChevronRight } from "react-icons/fa";

const Landingpage = () => {
  const navigate = useNavigate();

  const handleRoleSelection = (role) => {
    if (role === "student") navigate("/student/login");
    else if (role === "staff") navigate("/staff/login");
    else if (role === "admin") navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-5xl mx-auto text-center mt-16 mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-[#1E3A8A]">
          Welcome to the Student Application System
        </h1>
        <p className="mt-4 text-gray-600 text-lg">
          Choose your role to log in and access your personalized dashboard
        </p>
      </div>

      {/* Role Cards */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Student Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md hover:transform hover:scale-[1.02]">
            <div className="p-6 border-b border-gray-100">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <PiStudent className="w-8 h-8 text-[#1E3A8A]" />
              </div>
            </div>
            <div className="p-6">
              <h2 className="text-xl font-bold text-center text-gray-900 mb-4">Student</h2>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <FaChevronRight className="flex-shrink-0 h-4 w-4 text-blue-500 mt-1" />
                  <span className="ml-2 text-gray-600">Upload and manage your documents</span>
                </li>
                <li className="flex items-start">
                  <FaChevronRight className="flex-shrink-0 h-4 w-4 text-blue-500 mt-1" />
                  <span className="ml-2 text-gray-600">Track document approval status</span>
                </li>
                <li className="flex items-start">
                  <FaChevronRight className="flex-shrink-0 h-4 w-4 text-blue-500 mt-1" />
                  <span className="ml-2 text-gray-600">Secure blockchain verification</span>
                </li>
              </ul>
              <button
                onClick={() => handleRoleSelection("student")}
                className="w-full h-12 bg-[#1E3A8A] hover:bg-[#152a63] text-white rounded-md transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E3A8A]"
              >
                Login as Student
              </button>
            </div>
          </div>

          {/* Staff Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md hover:transform hover:scale-[1.02]">
            <div className="p-6 border-b border-gray-100">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <GoBriefcase className="w-8 h-8 text-gray-700" />
              </div>
            </div>
            <div className="p-6">
              <h2 className="text-xl font-bold text-center text-gray-900 mb-4">Staff</h2>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <FaChevronRight className="flex-shrink-0 h-4 w-4 text-gray-500 mt-1" />
                  <span className="ml-2 text-gray-600">Review and approve documents</span>
                </li>
                <li className="flex items-start">
                  <FaChevronRight className="flex-shrink-0 h-4 w-4 text-gray-500 mt-1" />
                  <span className="ml-2 text-gray-600">Manage application process</span>
                </li>
                <li className="flex items-start">
                  <FaChevronRight className="flex-shrink-0 h-4 w-4 text-gray-500 mt-1" />
                  <span className="ml-2 text-gray-600">Provide feedback to students</span>
                </li>
              </ul>
              <button
                onClick={() => handleRoleSelection("staff")}
                className="w-full h-12 bg-gray-700 hover:bg-gray-800 text-white rounded-md transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700"
              >
                Login as Staff
              </button>
            </div>
          </div>

          {/* Admin Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md hover:transform hover:scale-[1.02]">
            <div className="p-6 border-b border-gray-100">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                <MdOutlineBadge className="w-8 h-8 text-[#C3A135]" />
              </div>
            </div>
            <div className="p-6">
              <h2 className="text-xl font-bold text-center text-gray-900 mb-4">Admin</h2>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <FaChevronRight className="flex-shrink-0 h-4 w-4 text-amber-500 mt-1" />
                  <span className="ml-2 text-gray-600">Manage users and permissions</span>
                </li>
                <li className="flex items-start">
                  <FaChevronRight className="flex-shrink-0 h-4 w-4 text-amber-500 mt-1" />
                  <span className="ml-2 text-gray-600">Monitor system activity</span>
                </li>
                <li className="flex items-start">
                  <FaChevronRight className="flex-shrink-0 h-4 w-4 text-amber-500 mt-1" />
                  <span className="ml-2 text-gray-600">Configure blockchain settings</span>
                </li>
              </ul>
              <button
                onClick={() => handleRoleSelection("admin")}
                className="w-full h-12 bg-[#C3A135] hover:bg-[#a58829] text-white rounded-md transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C3A135]"
              >
                Login as Admin
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-5xl mx-auto mt-16 text-center">
        
      </div>
    </div>
  );
};

export default Landingpage;