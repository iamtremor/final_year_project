import React, { useState, useEffect } from "react";
import { 
  IoMdNotificationsOutline 
} from "react-icons/io";
import { 
  FiCheckCircle, 
  FiAlertCircle, 
  FiClock, 
  FiTrash2, 
  FiRefreshCw,
  FiEye, 
  FiFilter
} from "react-icons/fi";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../../../../context/AuthContext";
import { format } from "date-fns";

const Notification = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all"); // all, unread, read
  
  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications();
  }, []);
  
  // Function to fetch notifications - in a real app, this would call an API
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, you would call your API:
      // const response = await axios.get('/api/notifications', {
      //   headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      // });
      // setNotifications(response.data);
      
      // For now, we'll use the existing sample data but add document-related notifications
      const sampleNotifications = [
        {
          id: 1,
          title: "Transcript Approved",
          description: "Your transcript has been approved successfully.",
          timestamp: "2025-03-07",
          status: "success", // success, warning, or error
          isRead: false,
          documentId: "doc123",
          documentName: "University Transcript"
        },
        {
          id: 2,
          title: "Admission Letter Uploaded",
          description: "Your admission letter was uploaded for review.",
          timestamp: "2025-03-06",
          status: "warning",
          isRead: true,
          documentId: "doc124",
          documentName: "Admission Letter"
        },
        {
          id: 3,
          title: "Medical Report Rejected",
          description: "Your medical report was rejected. Please re-upload with clearer images.",
          timestamp: "2025-03-05",
          status: "error",
          isRead: false,
          documentId: "doc125",
          documentName: "Medical Report"
        },
        {
          id: 4,
          title: "WAEC Result Deleted",
          description: "You have deleted your WAEC Result document.",
          timestamp: "2025-03-04",
          status: "info",
          isRead: false,
          documentId: null,
          documentName: "WAEC Result"
        },
        {
          id: 5,
          title: "Document Submission Deadline",
          description: "Reminder: All required documents must be submitted within 7 days.",
          timestamp: "2025-03-03",
          status: "warning",
          isRead: true,
          documentId: null,
          documentName: null
        }
      ];
      
      setNotifications(sampleNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };
  
  // Function to mark notification as read
  const toggleReadStatus = async (id) => {
    try {
      // In a real app, you would call your API:
      // await axios.put(`/api/notifications/${id}/toggle-read`, {}, {
      //   headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      // });
      
      // Update state
      setNotifications(prevNotifications =>
        prevNotifications.map(notif =>
          notif.id === id ? { ...notif, isRead: !notif.isRead } : notif
        )
      );
      
      toast.success("Notification status updated");
    } catch (error) {
      console.error("Error updating notification:", error);
      toast.error("Failed to update notification status");
    }
  };
  
  // Function to mark all notifications as read
  const markAllAsRead = async () => {
    try {
      // In a real app, you would call your API:
      // await axios.put('/api/notifications/mark-all-read', {}, {
      //   headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      // });
      
      // Update state
      setNotifications(prevNotifications =>
        prevNotifications.map(notif => ({ ...notif, isRead: true }))
      );
      
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast.error("Failed to update notifications");
    }
  };
  
  // Function to delete notification
  const deleteNotification = async (id) => {
    try {
      // In a real app, you would call your API:
      // await axios.delete(`/api/notifications/${id}`, {
      //   headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      // });
      
      // Update state
      setNotifications(prevNotifications =>
        prevNotifications.filter(notif => notif.id !== id)
      );
      
      toast.success("Notification removed");
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to remove notification");
    }
  };
  
  // Function to clear all notifications
  const clearAllNotifications = async () => {
    try {
      // In a real app, you would call your API:
      // await axios.delete('/api/notifications/clear-all', {}, {
      //   headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      // });
      
      // Update state
      setNotifications([]);
      
      toast.success("All notifications cleared");
    } catch (error) {
      console.error("Error clearing notifications:", error);
      toast.error("Failed to clear notifications");
    }
  };
  
  // Function to view document details
  const viewDocument = (documentId) => {
    if (!documentId) return;
    
    // In a real app, you would navigate to the document:
    // navigate(`/student/document/${documentId}`);
    
    toast.success(`Viewing document ${documentId}`);
  };
  
  // Filter notifications based on active filter
  const filteredNotifications = activeFilter === "all" 
    ? notifications 
    : activeFilter === "unread" 
      ? notifications.filter(n => !n.isRead)
      : notifications.filter(n => n.isRead);
  
  // Get notification icon based on status
  const getNotificationIcon = (status) => {
    switch (status) {
      case "success":
        return <FiCheckCircle className="text-green-500" />;
      case "error":
        return <FiAlertCircle className="text-red-500" />;
      case "warning":
      case "info":
      default:
        return <FiClock className="text-yellow-500" />;
    }
  };
  
  // Get notification badge color
  const getNotificationBadgeClass = (status) => {
    switch (status) {
      case "success":
        return "bg-green-100 border-green-500 text-green-800";
      case "error":
        return "bg-red-100 border-red-500 text-red-800";
      case "warning":
        return "bg-yellow-100 border-yellow-500 text-yellow-800";
      case "info":
      default:
        return "bg-blue-100 border-blue-500 text-blue-800";
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return format(date, "MMM dd, yyyy");
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="p-6">
      <Toaster position="top-right" />
      
      {/* Header with counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <div className="text-2xl font-bold text-[#1E3A8A] flex items-center mb-4 sm:mb-0">
          <IoMdNotificationsOutline className="mr-2" />
          <h2>Notifications</h2>
          {filteredNotifications.filter(n => !n.isRead).length > 0 && (
            <span className="ml-2 bg-[#1E3A8A] text-white rounded-full text-sm px-2 py-1">
              {filteredNotifications.filter(n => !n.isRead).length} new
            </span>
          )}
        </div>
        
        {/* Filter tabs */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeFilter === "all"
                ? "bg-white text-[#1E3A8A] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveFilter("unread")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeFilter === "unread"
                ? "bg-white text-[#1E3A8A] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setActiveFilter("read")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeFilter === "read"
                ? "bg-white text-[#1E3A8A] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Read
          </button>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex justify-between mb-6">
        <button
          onClick={fetchNotifications}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#1E3A8A] hover:bg-[#152a63] focus:outline-none"
        >
          <FiRefreshCw className="mr-2" /> Refresh
        </button>
        
        <div className="flex space-x-3">
          <button
            onClick={markAllAsRead}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            disabled={notifications.filter(n => !n.isRead).length === 0}
          >
            <FiCheckCircle className="mr-2" /> Mark All as Read
          </button>
          <button
            onClick={clearAllNotifications}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            disabled={notifications.length === 0}
          >
            <FiTrash2 className="mr-2" /> Clear All
          </button>
        </div>
      </div>
      
      {/* Loading state */}
      {loading && (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1E3A8A] mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading notifications...</p>
        </div>
      )}
      
      {/* No notifications state */}
      {!loading && filteredNotifications.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="rounded-full bg-gray-100 p-3 mx-auto w-16 h-16 flex items-center justify-center">
            <IoMdNotificationsOutline className="text-gray-400 text-3xl" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No notifications</h3>
          <p className="mt-1 text-gray-500">
            {activeFilter === "unread" 
              ? "You've read all your notifications."
              : activeFilter === "read"
                ? "You don't have any read notifications."
                : "You don't have any notifications yet."}
          </p>
        </div>
      )}
      
      {/* Notifications list */}
      {!loading && filteredNotifications.length > 0 && (
        <div className="space-y-4">
          {filteredNotifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`bg-white rounded-lg shadow-sm overflow-hidden border-l-4 ${
                notification.isRead 
                  ? "border-gray-300" 
                  : getNotificationBadgeClass(notification.status)
              }`}
            >
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`mt-0.5 ${notification.isRead ? "text-gray-400" : ""}`}>
                      {getNotificationIcon(notification.status)}
                    </div>
                    <div>
                      <h3 className={`font-medium ${notification.isRead ? "text-gray-700" : "text-gray-900"}`}>
                        {notification.title}
                      </h3>
                      <p className={`mt-1 ${notification.isRead ? "text-gray-500" : "text-gray-600"}`}>
                        {notification.description}
                      </p>
                      {notification.documentName && (
                        <p className="mt-1 text-sm text-gray-500">
                          Document: {notification.documentName}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-gray-500">
                        {formatDate(notification.timestamp)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    {notification.documentId && (
                      <button
                        onClick={() => viewDocument(notification.documentId)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title="View document"
                      >
                        <FiEye />
                      </button>
                    )}
                    <button
                      onClick={() => toggleReadStatus(notification.id)}
                      className={`p-1 ${notification.isRead ? "text-gray-400 hover:text-gray-600" : "text-green-600 hover:text-green-800"}`}
                      title={notification.isRead ? "Mark as unread" : "Mark as read"}
                    >
                      <FiCheckCircle />
                    </button>
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="p-1 text-red-600 hover:text-red-800"
                      title="Delete notification"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notification;