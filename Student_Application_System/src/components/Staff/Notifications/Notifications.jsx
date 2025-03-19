import React, { useState, useEffect } from "react";
import { 
  FiCheckCircle, 
  FiXCircle, 
  FiAlertTriangle, 
  FiClock, 
  FiTrash2, 
  FiRefreshCw,
  FiCheck,
  FiFileText,
  FiEdit,
  FiArrowRight
} from "react-icons/fi";
import { IoMdNotificationsOutline } from "react-icons/io";
import api from "../../../utils/api";
import toast, { Toaster } from "react-hot-toast";

const StaffNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // "all", "unread", "read"
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  
  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications();
  }, []);
  
  // Function to fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error("Authentication token not found. Please log in again.");
        setLoading(false);
        return;
      }

      // Call the notifications API
      const response = await api.get('/notifications/user');
      setNotifications(response.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to load notifications");
      
      // Use mock data for demo if API fails
      const mockNotifications = [
        {
          _id: "1",
          title: "Document Submission",
          description: "A student has submitted a new document for review",
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          status: "info",
          isRead: false,
          type: "document_submission"
        },
        {
          _id: "2",
          title: "Form Approval Required",
          description: "A student's clearance form needs your approval",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
          status: "warning",
          isRead: true,
          type: "form_approval"
        },
        {
          _id: "3",
          title: "Document Approved by Another Staff",
          description: "Another staff member has approved a student's document",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          status: "success",
          isRead: false,
          type: "document_approved"
        }
      ];
      
      setNotifications(mockNotifications);
    } finally {
      setLoading(false);
    }
  };
  
  // Filter notifications based on the selected filter
  const filteredNotifications = () => {
    if (filter === "unread") {
      return notifications.filter(n => !n.isRead);
    } else if (filter === "read") {
      return notifications.filter(n => n.isRead);
    }
    return notifications;
  };
  
  // Toggle selection of a notification
  const toggleSelect = (notificationId) => {
    if (selectedNotifications.includes(notificationId)) {
      setSelectedNotifications(selectedNotifications.filter(id => id !== notificationId));
    } else {
      setSelectedNotifications([...selectedNotifications, notificationId]);
    }
  };
  
  // Toggle selection of all notifications
  const toggleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications().length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications().map(n => n._id));
    }
  };
  
  // Mark notifications as read
  const markAsRead = async (notificationIds) => {
    try {
      if (notificationIds.length === 0) return;
      
      if (notificationIds.length === notifications.length) {
        // Mark all as read
        await api.put('/notifications/mark-all-read');
      } else {
        // Mark individual notifications as read
        for (const id of notificationIds) {
          await api.put(`/notifications/${id}/toggle-read`);
        }
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notificationIds.includes(notification._id) 
            ? { ...notification, isRead: true } 
            : notification
        )
      );
      
      // Clear selection
      setSelectedNotifications([]);
      
      toast.success("Notification status updated");
    } catch (error) {
      console.error("Error updating notification:", error);
      
      // For demo/development - update state without API
      setNotifications(prev => 
        prev.map(notif => 
          notificationIds.includes(notif._id) ? { ...notif, isRead: true } : notif
        )
      );
      
      toast.success("Notification status updated (demo mode)");
    }
  };
  
  // Delete notifications
  const deleteNotifications = async (notificationIds) => {
    try {
      if (notificationIds.length === 0) return;
      
      if (notificationIds.length === notifications.length) {
        // Clear all notifications
        await api.delete('/notifications/clear-all');
        setNotifications([]);
      } else {
        // Delete individual notifications
        for (const id of notificationIds) {
          await api.delete(`/notifications/${id}`);
        }
        
        // Update local state
        setNotifications(prev => 
          prev.filter(notification => !notificationIds.includes(notification._id))
        );
      }
      
      // Clear selection and close modal if open
      setSelectedNotifications([]);
      setIsDeleteAllModalOpen(false);
      
      toast.success("Notifications removed");
    } catch (error) {
      console.error("Error deleting notification:", error);
      
      // For demo/development - update state without API
      setNotifications(prev => 
        prev.filter(notif => !notificationIds.includes(notif._id))
      );
      
      setIsDeleteAllModalOpen(false);
      toast.success("Notifications removed (demo mode)");
    }
  };
  
  // Get notification icon based on status and type
  const getNotificationIcon = (status, type) => {
    if (type && type.includes("document")) {
      return <FiFileText className="text-blue-500" />;
    } else if (type && type.includes("form")) {
      return <FiClock className="text-purple-500" />;
    } else if (type && type.includes("announcement")) {
      return <FiEdit className="text-purple-500" />;
    } else {
      // Default based on status
      switch (status) {
        case "success":
          return <FiCheckCircle className="text-green-500" />;
        case "error":
          return <FiXCircle className="text-red-500" />;
        case "warning":
          return <FiAlertTriangle className="text-yellow-500" />;
        default:
          return <FiFileText className="text-blue-500" />;
      }
    }
  };
  
  // Format time ago
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "N/A";
    const now = new Date();
    const date = new Date(timestamp);
    const secondsAgo = Math.floor((now - date) / 1000);
    
    if (secondsAgo < 60) {
      return "Just now";
    } else if (secondsAgo < 3600) {
      const minutes = Math.floor(secondsAgo / 60);
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    } else if (secondsAgo < 86400) {
      const hours = Math.floor(secondsAgo / 3600);
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else if (secondsAgo < 604800) {
      const days = Math.floor(secondsAgo / 86400);
      return `${days} day${days > 1 ? "s" : ""} ago`;
    } else {
      // For older notifications, show the actual date
      return date.toLocaleDateString();
    }
  };

  // Delete All Confirmation Modal
  const DeleteConfirmationModal = () => {
    if (!isDeleteAllModalOpen) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
              onClick={() => deleteNotifications(notifications.map(n => n._id))}
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
      <DeleteConfirmationModal />
      
      {/* Header with counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <div className="text-2xl font-bold text-[#1E3A8A] flex items-center mb-4 sm:mb-0">
          <IoMdNotificationsOutline className="mr-2" />
          <h2>Notifications</h2>
          {filteredNotifications().filter(n => !n.isRead).length > 0 && (
            <span className="ml-2 bg-[#1E3A8A] text-white rounded-full text-sm px-2 py-1">
              {filteredNotifications().filter(n => !n.isRead).length} new
            </span>
          )}
        </div>
        
        {/* Filter tabs */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              filter === "all"
                ? "bg-white text-[#1E3A8A] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              filter === "unread"
                ? "bg-white text-[#1E3A8A] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setFilter("read")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              filter === "read"
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
            onClick={() => markAsRead(notifications.filter(n => !n.isRead).map(n => n._id))}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            disabled={notifications.filter(n => !n.isRead).length === 0}
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
      {!loading && filteredNotifications().length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="rounded-full bg-gray-100 p-3 mx-auto w-16 h-16 flex items-center justify-center">
            <IoMdNotificationsOutline className="text-gray-400 text-3xl" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No notifications</h3>
          <p className="mt-1 text-gray-500">
            {filter === "unread" 
              ? "You've read all your notifications."
              : filter === "read"
                ? "You don't have any read notifications."
                : "You don't have any notifications yet."}
          </p>
          {filter !== "all" && (
            <button
              onClick={() => setFilter("all")}
              className="mt-4 text-[#1E3A8A] hover:text-[#152a63] inline-flex items-center"
            >
              View all notifications <FiArrowRight className="ml-1" />
            </button>
          )}
        </div>
      )}
      
      {/* Notifications list */}
      {!loading && filteredNotifications().length > 0 && (
        <div className="space-y-4">
          {filteredNotifications().map((notification) => (
            <div 
              key={notification._id} 
              className={`bg-white rounded-lg shadow-sm overflow-hidden border-l-4 ${
                notification.isRead 
                  ? "border-gray-300" 
                  : notification.status === "success" ? "border-green-500"
                  : notification.status === "error" ? "border-red-500"
                  : notification.status === "warning" ? "border-yellow-500"
                  : "border-blue-500"
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
                        {formatTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    {notification.documentId && (
                      <a
                        href={`/staff/review-document/${notification.documentId}`}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title="View document"
                      >
                        <FiFileText />
                      </a>
                    )}
                    <button
                      onClick={() => toggleSelect(notification._id)}
                      className={`p-1 ${selectedNotifications.includes(notification._id) ? "text-[#1E3A8A]" : "text-gray-400 hover:text-gray-600"}`}
                      title="Select notification"
                    >
                      <FiCheck />
                    </button>
                    <button
                      onClick={() => markAsRead([notification._id])}
                      className={`p-1 ${notification.isRead ? "text-gray-400 hover:text-gray-600" : "text-green-600 hover:text-green-800"}`}
                      title={notification.isRead ? "Mark as unread" : "Mark as read"}
                    >
                      <FiCheckCircle />
                    </button>
                    <button
                      onClick={() => deleteNotifications([notification._id])}
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
      
      {/* Selection Action Bar - Appears when notifications are selected */}
      {selectedNotifications.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-md border-t p-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{selectedNotifications.length}</span> notification{selectedNotifications.length !== 1 ? 's' : ''} selected
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => markAsRead(selectedNotifications)}
                className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <FiCheck className="mr-1" /> Mark as Read
              </button>
              <button
                onClick={() => deleteNotifications(selectedNotifications)}
                className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                <FiTrash2 className="mr-1" /> Delete
              </button>
              <button
                onClick={() => setSelectedNotifications([])}
                className="inline-flex items-center px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffNotifications;