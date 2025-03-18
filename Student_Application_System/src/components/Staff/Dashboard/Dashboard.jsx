import React, { useEffect, useState } from 'react';
import { FiCheck, FiX, FiClock, FiFileText, FiUser, FiPieChart } from 'react-icons/fi';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../utils/api';

const StaffDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    pendingApprovals: { forms: 0, documents: 0 },
    completedApprovals: { forms: 0, documents: 0 },
    studentsInDepartment: 0
  });
  const [pendingItems, setPendingItems] = useState({ forms: [], documents: [] });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/dashboard/staff');
        setStats(response.data.stats);
        setPendingItems(response.data.pendingItems);
        setNotifications(response.data.notifications);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Could not load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full p-8">
        <div className="animate-pulse text-lg">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-600 m-4">
        <p className="font-semibold">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">{user?.department || 'Staff'} Dashboard</h1>
      
      {/* Stats Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Pending Documents</p>
              <p className="text-2xl font-bold">{stats.pendingApprovals.documents}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FiFileText className="text-blue-500 text-xl" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Pending Forms</p>
              <p className="text-2xl font-bold">{stats.pendingApprovals.forms}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <FiClock className="text-purple-500 text-xl" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Approved Documents</p>
              <p className="text-2xl font-bold">{stats.completedApprovals.documents}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FiCheck className="text-green-500 text-xl" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Approved Forms</p>
              <p className="text-2xl font-bold">{stats.completedApprovals.forms}</p>
            </div>
            <div className="bg-amber-100 p-3 rounded-full">
              <FiCheck className="text-amber-500 text-xl" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Pending Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Pending Documents */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <FiFileText className="mr-2" /> Pending Documents
          </h2>
          
          {pendingItems.documents.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No pending documents to review</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pendingItems.documents.slice(0, 5).map((doc, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{doc.type}</div>
                        <div className="text-sm text-gray-500">{doc.title}</div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {doc.studentName}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {new Date(doc.uploadedDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-center">
                        <a 
                          href={`/staff/review-document/${doc.id}`} 
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          Review
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {pendingItems.documents.length > 5 && (
                <div className="text-center mt-4">
                  <a 
                    href="/staff/pending-approvals" 
                    className="text-blue-600 hover:text-blue-800 text-sm hover:underline"
                  >
                    View all {pendingItems.documents.length} pending documents
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Pending Forms */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <FiClock className="mr-2" /> Pending Forms
          </h2>
          
          {pendingItems.forms.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No pending forms to review</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Form Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pendingItems.forms.slice(0, 5).map((form, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{form.formName}</div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {form.studentName}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {new Date(form.submittedDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-center">
                        <a 
                          href={`/staff/review-form/${form.id}?formType=${form.type}`} 
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          Review
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {pendingItems.forms.length > 5 && (
                <div className="text-center mt-4">
                  <a 
                    href="/staff/pending-approvals" 
                    className="text-blue-600 hover:text-blue-800 text-sm hover:underline"
                  >
                    View all {pendingItems.forms.length} pending forms
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Recent Notifications */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Recent Notifications</h2>
        
        {notifications.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No notifications</p>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.map((notification, index) => (
              <div key={index} className={`py-3 px-2 ${notification.isRead ? 'bg-white' : 'bg-blue-50'}`}>
                <div className="flex items-start">
                  {getNotificationIcon(notification.status)}
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                    <p className="text-sm text-gray-500">{notification.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="text-center pt-4">
              <a 
                href="/staff/notifications" 
                className="text-blue-600 hover:text-blue-800 text-sm hover:underline"
              >
                View all notifications
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to get appropriate notification icon
const getNotificationIcon = (status) => {
  switch (status) {
    case 'success':
      return <div className="bg-green-100 p-2 rounded-full"><FiCheck className="text-green-500" /></div>;
    case 'error':
      return <div className="bg-red-100 p-2 rounded-full"><FiX className="text-red-500" /></div>;
    case 'warning':
      return <div className="bg-yellow-100 p-2 rounded-full"><FiClock className="text-yellow-500" /></div>;
    default:
      return <div className="bg-blue-100 p-2 rounded-full"><FiFileText className="text-blue-500" /></div>;
  }
};

export default StaffDashboard;