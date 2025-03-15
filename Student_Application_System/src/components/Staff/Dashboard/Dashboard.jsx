import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import axios from "axios";
import api from "../../../utils/api";
import { 
  FaTasks, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaBell, 
  FaUserCircle,
  FaClipboardList,
  FaFileAlt
} from "react-icons/fa";
import { FiAlertTriangle, FiClock } from "react-icons/fi";
import { MdOutlineSpaceDashboard } from "react-icons/md";

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [pendingForms, setPendingForms] = useState([]);
  const [pendingDocuments, setPendingDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        const [
          dashboardResponse, 
          formsResponse, 
          documentsResponse
        ] = await Promise.all([
          api.get('/dashboard/staff'),
          api.get('/clearance/forms/pending'),
          api.get('/documents/staff/approvable')
        ]);
  
        console.log('Dashboard Data:', dashboardResponse.data);
        console.log('Pending Forms:', formsResponse.data);
        console.log('Pending Documents:', documentsResponse.data);
  
        setDashboardData(dashboardResponse.data);
        setPendingForms(formsResponse.data.forms || []); // Use .forms from the new backend response
        setPendingDocuments(documentsResponse.data);
  
        setLoading(false);
      } catch (error) {
        console.error('Dashboard Fetch Error:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };
  
    fetchDashboardData();
  }, []);
  // Function to get the appropriate forms based on staff department
  const getRelevantForms = () => {
    if (!user || !pendingForms) return [];
  
    // Filter forms based on staff department and role
    return pendingForms.filter(form => {
      // For Deputy Registrar: all New Clearance forms not yet approved
      if (user.department === 'Registrar') {
        return form.formType === 'newClearance' && !form.deputyRegistrarApproved;
      }
      
      // For School Officers: New Clearance forms approved by Deputy Registrar 
      // and for their department
      if (!user.department.includes('HOD')) {
        return (
          form.formType === 'newClearance' && 
          form.deputyRegistrarApproved && 
          !form.schoolOfficerApproved && 
          form.studentId?.department === user.department
        );
      }
  
      // For other cases, include all pending forms
      return true;
    });
  };

  const renderStats = () => {
    if (!dashboardData || !dashboardData.stats) return null;

    const { stats } = dashboardData;

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
              {stats.pendingApprovals.forms + stats.pendingApprovals.documents} items awaiting your review
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
              Approved Items
            </h3>
            <p className="text-sm text-green-600">
              {stats.completedApprovals.forms + stats.completedApprovals.documents} items you have approved
            </p>
          </div>
          <FaCheckCircle size={30} className="text-green-600" />
        </Link>

        {/* Department Stats Card */}
        <div className="bg-blue-100 p-6 rounded-md shadow-md flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-800">
              Department: {user?.department}
            </h3>
            <p className="text-sm text-blue-600">
              {stats.studentsInDepartment > 0 
                ? `${stats.studentsInDepartment} students in your department` 
                : "Department-wide support role"}
            </p>
          </div>
          <FaUserCircle size={30} className="text-blue-600" />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  // Get the relevant forms for this staff member
  const relevantForms = getRelevantForms();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center mb-6">
        <MdOutlineSpaceDashboard size={30} className="text-[#1E3A8A] mr-2" />
        <h2 className="text-2xl font-bold text-[#1E3A8A]">Staff Dashboard</h2>
      </div>

      {/* Statistics Cards */}
      {renderStats()}

      {/* Pending Forms Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center mb-4">
          <FaClipboardList size={22} className="text-[#1E3A8A] mr-2" />
          <h3 className="text-lg font-bold text-[#1E3A8A]">Forms Awaiting Your Approval</h3>
        </div>

        {relevantForms.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student Name
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Form Type
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted Date
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
              {relevantForms.map((form) => (
  <tr key={form._id} className="hover:bg-gray-50">
    <td className="py-4 px-4 whitespace-nowrap">
      {form.studentId?.fullName || form.studentName || "Unknown Student"}
    </td>
    <td className="py-4 px-4 whitespace-nowrap">
      {form.formType === 'newClearance' ? 'New Clearance Form' : 
       form.formType === 'provAdmission' ? 'Provisional Admission Form' :
       form.formType === 'personalRecord' ? 'Personal Record Form' :
       form.formType === 'personalRecord2' ? 'Family Information Form' :
       form.formType === 'affidavit' ? 'Rules & Regulations Affidavit' :
       'Unknown Form'}
    </td>
    <td className="py-4 px-4 whitespace-nowrap">
      {new Date(form.submittedDate).toLocaleDateString()}
    </td>
    <td className="py-4 px-4 whitespace-nowrap">
      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
        Pending Review
      </span>
    </td>
    <td className="py-4 px-4 whitespace-nowrap">
      <Link 
        to={`/staff/review-form/${form._id}?type=${form.formType}`}
        className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded text-sm"
      >
        Review
      </Link>
    </td>
  </tr>
))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <FiClock size={40} className="mx-auto text-gray-400" />
            <p className="mt-2 text-gray-500">No forms are pending your approval at this time.</p>
          </div>
        )}
      </div>

      {/* Pending Documents Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center mb-4">
          <FaFileAlt size={22} className="text-[#1E3A8A] mr-2" />
          <h3 className="text-lg font-bold text-[#1E3A8A]">Documents Awaiting Your Approval</h3>
        </div>

        {pendingDocuments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student Name
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document Type
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded Date
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pendingDocuments.map((doc) => (
                  <tr key={doc._id} className="hover:bg-gray-50">
                    <td className="py-4 px-4 whitespace-nowrap">
                      {doc.owner?.fullName || "Unknown Student"}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      {doc.documentType}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Pending Review
                      </span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <Link 
                        to={`/staff/review-document/${doc._id}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded text-sm"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <FiClock size={40} className="mx-auto text-gray-400" />
            <p className="mt-2 text-gray-500">No documents are pending your approval at this time.</p>
          </div>
        )}
      </div>

      {/* Recent Activity Section (if available) */}
      {dashboardData?.pendingItems && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <FaBell size={22} className="text-[#1E3A8A] mr-2" />
            <h3 className="text-lg font-bold text-[#1E3A8A]">Recent Activities</h3>
          </div>
          
          {dashboardData.notifications?.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.notifications.map((notification, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start">
                    <div className={`
                      p-2 rounded-full mr-3 flex-shrink-0
                      ${notification.status === 'success' ? 'bg-green-100' : 
                        notification.status === 'warning' ? 'bg-yellow-100' : 
                        notification.status === 'error' ? 'bg-red-100' : 'bg-blue-100'}
                    `}>
                      {notification.status === 'success' ? <FaCheckCircle className="text-green-600" /> :
                       notification.status === 'warning' ? <FiAlertTriangle className="text-yellow-600" /> :
                       notification.status === 'error' ? <FaTimesCircle className="text-red-600" /> :
                       <FaBell className="text-blue-600" />
                      }
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{notification.title}</h4>
                      <p className="text-sm text-gray-600">{notification.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <FaBell size={40} className="mx-auto text-gray-400" />
              <p className="mt-2 text-gray-500">No recent activities to display.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;