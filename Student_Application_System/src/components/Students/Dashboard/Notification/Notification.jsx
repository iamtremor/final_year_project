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
  FiFilter,
  FiFileText,
  FiEdit,
  FiArrowRight
} from "react-icons/fi";
import api from "../../../../utils/api";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../../../../context/AuthContext";
import { format, formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";

const Notification = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState("all"); // all, unread, read
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  
  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications();
    
    // Optional: fetch unread count periodically
    const refreshInterval = setInterval(() => {
      fetchUnreadCount();
    }, 60000); // Every minute
    
    return () => clearInterval(refreshInterval);
  }, []);
  
  // Function to fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      const { count } = response.data;
      setUnreadCount(count);
      return count;
    } catch (error) {
      console.error("Error fetching unread count:", error);
      return 0;
    }
  };

  // Calculate unread count from notifications
  const calculateUnreadCount = (notificationList) => {
    const count = notificationList.filter(n => n.isRead === false).length;
    setUnreadCount(count);
    return count;
  };
  
  // Function to fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      try {
        // Call the notifications API
        const response = await api.get('/notifications/user');
        
        if (response.data && response.data.length > 0) {
          setNotifications(response.data);
          
          // Calculate and set unread count
          calculateUnreadCount(response.data);
          console.log(`Found ${response.data.length} notifications, ${calculateUnreadCount(response.data)} unread`);
        } else {
          // No notifications
          setNotifications([]);
          setUnreadCount(0);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
        toast.error("Failed to load notifications");
        
        // Reset notifications if fetch fails
        setNotifications([]);
        setUnreadCount(0);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Function to mark notification as read
  const toggleReadStatus = async (notification) => {
    try {
      const notificationId = notification.id || notification._id;
      
      if (!notificationId) {
        console.error("Attempted to toggle notification with undefined ID");
        toast.error("Unable to update notification: ID is missing");
        return;
      }
      
      // Call the correct API endpoint with proper ID
      await api.put(`/notifications/${notificationId}/toggle-read`);
      
      // Update state
      setNotifications(prevNotifications => {
        const updatedNotifications = prevNotifications.map(notif => {
          const notifId = notif.id || notif._id;
          if (notifId === notificationId) {
            return { ...notif, isRead: !notif.isRead };
          }
          return notif;
        });
        
        // Recalculate unread count
        calculateUnreadCount(updatedNotifications);
        
        return updatedNotifications;
      });
      
      toast.success("Notification status updated");
    } catch (error) {
      console.error("Error updating notification:", error);
      toast.error("Failed to update notification");
    }
  };
  
  // Function to mark all notifications as read
  const markAllAsRead = async () => {
    try {
      // Make API call to mark all as read
      await api.put('/notifications/mark-all-read');
      
      // Update state
      setNotifications(prevNotifications => {
        const updatedNotifications = prevNotifications.map(notif => ({ 
          ...notif, 
          isRead: true 
        }));
        
        // Set unread count to 0
        setUnreadCount(0);
        
        return updatedNotifications;
      });
      
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast.error("Failed to update notifications");
    }
  };
  
  const deleteNotification = async (notification) => {
    try {
      // Get the correct ID (either id or _id)
      const notificationId = notification.id || notification._id;
      
      if (!notificationId) {
        console.error("Attempted to delete notification with undefined ID", notification);
        toast.error("Unable to delete notification: ID is missing");
        return;
      }
  
      console.log(`Deleting notification with ID: ${notificationId}`);
      
      // Track if the deleted notification was unread
      const wasUnread = notification.isRead === false;
      
      // Call the API endpoint with the correct ID
      await api.delete(`/notifications/${notificationId}`);
      
      // Update the state to remove the deleted notification
      setNotifications(prevNotifications => {
        const updatedNotifications = prevNotifications.filter(notif => {
          // Filter out by matching either id or _id
          const notifId = notif.id || notif._id;
          return notifId !== notificationId;
        });
        
        // If we deleted an unread notification, update the count
        if (wasUnread) {
          setUnreadCount(prevCount => Math.max(0, prevCount - 1));
        }
        
        return updatedNotifications;
      });
      
      toast.success("Notification removed");
    } catch (error) {
      console.error("Error deleting notification:", error);
      
      if (error.response && error.response.data) {
        console.error("Server error response:", error.response.data);
        toast.error(error.response.data.message || "Failed to delete notification");
      } else {
        toast.error("Failed to delete notification");
      }
    }
  };
  
  // Function to clear all notifications
  const clearAllNotifications = async () => {
    try {
      console.log("Clearing all notifications");
      
      // Use the proper API endpoint for clearing all notifications
      await api.delete('/notifications/clear-all');
      
      // Clear notifications from state
      setNotifications([]);
      // Reset unread count
      setUnreadCount(0);
      setIsDeleteAllModalOpen(false);
      
      toast.success("All notifications cleared");
    } catch (error) {
      console.error("Error clearing notifications:", error);
      
      if (error.response && error.response.data) {
        console.error("Server error response:", error.response.data);
        toast.error(error.response.data.message || "Failed to clear notifications");
      } else {
        toast.error("Failed to clear notifications");
      }
      
      setIsDeleteAllModalOpen(false);
    }
  };
  
  // Function to view document details
  const viewDocument = (documentId, notificationType) => {
    if (!documentId) return;
    
    // In a real app, you would navigate to the document
    if (notificationType === 'document_rejection') {
      // Navigate to upload page for rejected docs
      window.location.href = `/student/upload?documentId=${documentId}`;
    } else {
      // Navigate to document details
      window.location.href = `/student/my-documents?documentId=${documentId}`;
    }
  };
  
  // Filter notifications based on active filter
  const filteredNotifications = activeFilter === "all" 
    ? notifications 
    : activeFilter === "unread" 
      ? notifications.filter(n => n.isRead === false)  // Explicitly check for false
      : notifications.filter(n => n.isRead === true);  // Explicitly check for true
  
  // Get notification icon based on status and type
  const getNotificationIcon = (status, type) => {
    if (type === 'document_approval') {
      return <FiCheckCircle className="text-green-500" />;
    } else if (type === 'document_rejection') {
      return <FiAlertCircle className="text-red-500" />;
    } else if (type === 'document_upload') {
      return <FiFileText className="text-blue-500" />;
    } else if (type === 'deadline_reminder') {
      return <FiClock className="text-yellow-500" />;
    } else if (type === 'announcement') {
      return <FiEdit className="text-purple-500" />;
    } else {
      // Default based on status
      switch (status) {
        case "success":
          return <FiCheckCircle className="text-green-500" />;
        case "error":
          return <FiAlertCircle className="text-red-500" />;
        case "warning":
          return <FiClock className="text-yellow-500" />;
        default:
          return <FiFileText className="text-blue-500" />;
      }
    }
  };
  
  // Get notification badge color
  const getNotificationBadgeClass = (status, type) => {
    if (type === 'document_approval') {
      return "bg-green-100 border-green-500 text-green-800";
    } else if (type === 'document_rejection') {
      return "bg-red-100 border-red-500 text-red-800";
    } else if (type === 'document_upload' || type === 'document_deletion') {
      return "bg-blue-100 border-blue-500 text-blue-800";
    } else if (type === 'deadline_reminder') {
      return "bg-yellow-100 border-yellow-500 text-yellow-800";
    } else if (type === 'announcement') {
      return "bg-purple-100 border-purple-500 text-purple-800";
    } else {
      // Default based on status
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
    }
  };
  
  // Format date with relative time for recent notifications
  const formatTimestamp = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = (now - date) / (1000 * 60 * 60);
      
      if (diffInHours < 24) {
        // Within 24 hours, show relative time (e.g., "2 hours ago")
        return formatDistanceToNow(date, { addSuffix: true });
      } else if (diffInHours < 48) {
        // Within 48 hours, show "Yesterday at HH:MM"
        return `Yesterday at ${format(date, 'h:mm a')}`;
      } else {
        // Otherwise, show full date
        return format(date, 'MMM dd, yyyy - h:mm a');
      }
    } catch (error) {
      return dateString;
    }
  };

  // Delete All Confirmation Modal
  const DeleteAllModal = () => {
    return (
      <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300 ${isDeleteAllModalOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Clear All Notifications</h3>
          <p className="text-gray-600 mb-6">
            Are you sure you want to clear all notifications? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setIsDeleteAllModalOpen(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={clearAllNotifications}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <Toaster position="top-right" />
      <DeleteAllModal />
      
      {/* Header with counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <div className="text-2xl font-bold text-[#1E3A8A] flex items-center mb-4 sm:mb-0">
          <IoMdNotificationsOutline className="mr-2" />
          <h2>Notifications</h2>
          {unreadCount > 0 && (
            <span className="ml-2 bg-[#1E3A8A] text-white rounded-full text-sm px-2 py-1">
              {unreadCount} new
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
            disabled={unreadCount === 0}
          >
            <FiCheckCircle className="mr-2" /> Mark All as Read
          </button>
          <button
            onClick={() => setIsDeleteAllModalOpen(true)}
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
          {activeFilter !== "all" && (
            <button
              onClick={() => setActiveFilter("all")}
              className="mt-4 text-[#1E3A8A] hover:text-[#152a63] inline-flex items-center"
            >
              View all notifications <FiArrowRight className="ml-1" />
            </button>
          )}
        </div>
      )}
      
      {/* Notifications list */}
      {!loading && filteredNotifications.length > 0 && (
        <div className="space-y-4">
          {filteredNotifications.map((notification) => (
            <div 
              key={notification.id || notification._id} 
              className={`bg-white rounded-lg shadow-sm overflow-hidden border-l-4 ${
                notification.isRead 
                  ? "border-gray-300" 
                  : getNotificationBadgeClass(notification.status, notification.type)
              }`}
            >
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`mt-0.5 ${notification.isRead ? "text-gray-400" : ""}`}>
                      {getNotificationIcon(notification.status, notification.type)}
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
                        {formatTimestamp(notification.timestamp || notification.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    {notification.documentId && (
                      <button
                        onClick={() => viewDocument(notification.documentId, notification.type)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title="View document"
                      >
                        <FiEye />
                      </button>
                    )}
                    <button
                      onClick={() => toggleReadStatus(notification)}
                      className={`p-1 ${notification.isRead ? "text-gray-400 hover:text-gray-600" : "text-green-600 hover:text-green-800"}`}
                      title={notification.isRead ? "Mark as unread" : "Mark as read"}
                    >
                      <FiCheckCircle />
                    </button>
                    <button
                      onClick={() => deleteNotification(notification)}
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