import React, { useEffect, useState } from 'react';
import { 
  FiCheckCircle, 
  FiXCircle, 
  FiClock, 
  FiFileText, 
  FiShield,
  FiMessageSquare
} from 'react-icons/fi';
import { IoIosArrowForward } from 'react-icons/io';
import { MdOutlineSpaceDashboard } from 'react-icons/md';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../utils/api';
import { Toaster } from 'react-hot-toast';

const StaffDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    pendingApprovals: { forms: 0, documents: 0 },
    completedApprovals: { forms: 0, documents: 0 },
    studentsInDepartment: 0
  });
  const [pendingItems, setPendingItems] = useState({ forms: [], documents: [] });
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/dashboard/staff');
        setStats(response.data.stats);
        setPendingItems(response.data.pendingItems);
        setNotifications(response.data.notifications);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Could not load dashboard data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Create styled cards function (similar to student dashboard)
  const styling = (
    bgColor,
    textColor,
    title,
    count,
    Icon,
    border = "",
    link,
    linkName
  ) => {
    return (
      <div className=" ">
        <div
          className="w-auto px-4 md:px-5 py-8 h-full flex justify-between items-center"
          style={{
            borderRadius: "4px",
            boxShadow: "0px 3px 12px 0px rgba(197, 197, 197, 0.25)",
            backgroundColor: bgColor,
            border: border,
          }}
        >
          <div>
            <h3
              className="font-light"
              style={{
                color: textColor,
                fontSize: "14px",
                lineHeight: "24px",
              }}
            >
              {title}
            </h3>
            {isLoading ? (
              <div className="animate-pulse h-8 w-8 bg-gray-300 rounded my-2"></div>
            ) : (
              <p
                className="font-bold pt-2"
                style={{
                  color: textColor,
                  fontSize: "32px",
                }}
              >
                {count}
              </p>
            )}

            <a
              href={link}
              className="text-[12px] flex items-center underline"
              style={{ color: textColor }}
            >
              {linkName}
              <IoIosArrowForward
                className="ml-1"
                style={{ color: textColor }}
              />
            </a>
          </div>
          <Icon className="text-[39px]" style={{ color: textColor }} />
        </div>
      </div>
    );
  };

  // Function to get appropriate notification icon
  const getNotificationIcon = (status) => {
    switch (status) {
      case "success":
        return <div className="bg-green-100 p-2 rounded-full"><FiCheckCircle className="text-green-500" /></div>;
      case "error":
        return <div className="bg-red-100 p-2 rounded-full"><FiXCircle className="text-red-500" /></div>;
      case "warning":
        return <div className="bg-yellow-100 p-2 rounded-full"><FiClock className="text-yellow-500" /></div>;
      default:
        return <div className="bg-blue-100 p-2 rounded-full"><FiMessageSquare className="text-blue-500" /></div>;
    }
  };

  return (
    <div
      style={{ backgroundColor: "#F6F6F6" }}
      className="w-full h-full overflow-auto"
    >
      <Toaster position="top-right" />
      <div className="text-2xl font-bold text-[#1E3A8A] mx-6 flex items-center">
        <MdOutlineSpaceDashboard />
        <h2 className="m-2">{user?.department || 'Staff'} Dashboard</h2>
      </div>
      
      {error && (
        <div className="mx-5 mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      {/* Stats Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 pb-7 px-5">
        {styling(
          "#1E3A8A",
          "#FFF",
          "Pending Documents",
          stats.pendingApprovals.documents,
          FiFileText,
          "1px solid #FFF",
          "/staff/pending-approvals?type=documents",
          "Review Documents"
        )}
        {styling(
          "#C3A135",
          "#FFF",
          "Pending Forms",
          stats.pendingApprovals.forms,
          FiClock,
          "1px solid #FFF",
          "/staff/pending-approvals?type=forms",
          "Review Forms"
        )}
        {styling(
          "#FFF",
          "#4A5568",
          "Approved Documents",
          stats.completedApprovals.documents,
          FiCheckCircle,
          "1px solid #FFF",
          "/staff/approved?type=documents",
          "View Documents"
        )}
        {styling(
          "#3B2774",
          "#FFF",
          "Approved Forms",
          stats.completedApprovals.forms,
          FiShield,
          "1px solid #FFF",
          "/staff/approved?type=forms",
          "View Forms"
        )}
      </div>
      
      {/* Department Status Card */}
      <div className="mx-5 mb-4 p-4 bg-white rounded-md shadow-sm">
        <h2 className="text-lg font-medium text-[#1E3A8A] mb-2">Department Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded border">
            <div className="flex items-center mb-2">
              <FiShield className="text-[#3B2774] mr-2" />
              <h3 className="font-medium">Verification Process</h3>
            </div>
            <p className="text-sm text-gray-600">
              Your department has approved {stats.completedApprovals.documents} documents that are ready for blockchain verification.
              {pendingItems.documents.length > 0 && (
                <span className="block mt-1 text-yellow-600">
                  {pendingItems.documents.length} documents are pending your review.
                </span>
              )}
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded border">
            <div className="flex items-center mb-2">
              <FiClock className="text-[#C3A135] mr-2" />
              <h3 className="font-medium">Processing Status</h3>
            </div>
            <p className="text-sm text-gray-600">
              You have processed {stats.completedApprovals.documents + stats.completedApprovals.forms} items this period.
              {pendingItems.forms.length + pendingItems.documents.length > 0 ? (
                <span className="block mt-1 text-blue-600">
                  {pendingItems.forms.length + pendingItems.documents.length} items are awaiting your review.
                </span>
              ) : (
                <span className="block mt-1 text-green-600">
                  All items have been processed. Great job!
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      <a href="/staff/pending-approvals" className="flex items-center mb-3 mx-7">
        <h2 className="text-lg font-medium text-[#1E3A8A]">Pending Items</h2>
        <IoIosArrowForward className="ml-1 text-black" />
      </a>
      
      {/* Pending Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-5 mb-6">
        {/* Pending Documents */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-medium text-[#1E3A8A] flex items-center">
              <FiFileText className="mr-2" /> Documents
            </h2>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1E3A8A]"></div>
            </div>
          ) : pendingItems.documents.length === 0 ? (
            <div className="text-center py-6">
              <div className="rounded-full bg-gray-100 p-3 mx-auto w-16 h-16 flex items-center justify-center mb-3">
                <FiFileText className="text-gray-400 text-2xl" />
              </div>
              <p className="text-gray-500">No pending documents to review</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pendingItems.documents.slice(0, 5).map((doc, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{doc.type}</div>
                        <div className="text-sm text-gray-500">{doc.title}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {doc.studentName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {new Date(doc.uploadedDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                        <a 
                          href={`/staff/review-document/${doc.id}`} 
                          className="text-[#1E3A8A] hover:text-[#152a63] hover:underline"
                        >
                          Review
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {pendingItems.documents.length > 5 && (
                <div className="text-center py-3 border-t">
                  <a 
                    href="/staff/pending-approvals?type=documents" 
                    className="text-[#1E3A8A] hover:text-[#152a63] text-sm hover:underline inline-flex items-center"
                  >
                    View all {pendingItems.documents.length} pending documents
                    <IoIosArrowForward className="ml-1" />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Pending Forms */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-medium text-[#1E3A8A] flex items-center">
              <FiClock className="mr-2" /> Forms
            </h2>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1E3A8A]"></div>
            </div>
          ) : pendingItems.forms.length === 0 ? (
            <div className="text-center py-6">
              <div className="rounded-full bg-gray-100 p-3 mx-auto w-16 h-16 flex items-center justify-center mb-3">
                <FiClock className="text-gray-400 text-2xl" />
              </div>
              <p className="text-gray-500">No pending forms to review</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Form Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pendingItems.forms.slice(0, 5).map((form, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{form.formName}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {form.studentName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {new Date(form.submittedDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                        <a 
                          href={`/staff/review-form/${form.id}?formType=${form.type}`} 
                          className="text-[#1E3A8A] hover:text-[#152a63] hover:underline"
                        >
                          Review
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {pendingItems.forms.length > 5 && (
                <div className="text-center py-3 border-t">
                  <a 
                    href="/staff/pending-approvals?type=forms" 
                    className="text-[#1E3A8A] hover:text-[#152a63] text-sm hover:underline inline-flex items-center"
                  >
                    View all {pendingItems.forms.length} pending forms
                    <IoIosArrowForward className="ml-1" />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <a href="/staff/notifications" className="flex items-center mb-3 mx-7">
        <h2 className="text-lg font-medium text-[#1E3A8A]">Recent Notifications</h2>
        <IoIosArrowForward className="ml-1 text-black" />
      </a>
      
      {/* Recent Notifications */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mx-5 mb-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1E3A8A]"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-6">
            <div className="rounded-full bg-gray-100 p-3 mx-auto w-16 h-16 flex items-center justify-center mb-3">
              <FiMessageSquare className="text-gray-400 text-2xl" />
            </div>
            <p className="text-gray-500">No notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.slice(0, 5).map((notification, index) => (
              <div key={index} className={`py-4 px-4 ${notification.isRead ? 'bg-white' : 'bg-blue-50'}`}>
                <div className="flex items-start">
                  {getNotificationIcon(notification.status)}
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                    <p className="text-sm text-gray-600">{notification.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="text-center py-3">
              <a 
                href="/staff/notifications" 
                className="text-[#1E3A8A] hover:text-[#152a63] text-sm hover:underline inline-flex items-center"
              >
                View all notifications
                <IoIosArrowForward className="ml-1" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;