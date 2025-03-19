import React, { useState, useEffect } from "react";
import { 
  FiCheckCircle, 
  FiXCircle, 
  FiAlertTriangle, 
  FiInfo, 
  FiFilter, 
  FiTrash2,
  FiCheck,
  FiFileText,
  FiClock
} from "react-icons/fi";
import api from "../../../utils/api";

const StaffNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // "all", "unread", "document", "form", etc.
  const [selectedNotifications, setSelectedNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await api.get("/notifications/user"); // Same endpoint works for all users
        setNotifications(response.data);
      } catch (err) {
        console.error("Error fetching notifications:", err);
        setError("Failed to load notifications. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // Filter notifications based on the selected filter
  const filteredNotifications = () => {
    if (filter === "unread") {
      return notifications.filter(notification => !notification.isRead);
    } else if (filter === "document") {
      return notifications.filter(notification => 
        notification.type.includes("document")
      );
    } else if (filter === "form") {
      return notifications.filter(notification => 
        notification.type.includes("form")
      );
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

  // Select/Deselect all notifications
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
    } catch (err) {
      console.error("Error marking notifications as read:", err);
      setError("Failed to mark notifications as read. Please try again later.");
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
      
      // Clear selection
      setSelectedNotifications([]);
    } catch (err) {
      console.error("Error deleting notifications:", err);
      setError("Failed to delete notifications. Please try again later.");
    }
  };

  // Get appropriate icon for notification status
  const getNotificationIcon = (status) => {
    switch (status) {
      case "success":
        return <FiCheckCircle className="text-green-500" />;
      case "error":
        return <FiXCircle className="text-red-500" />;
      case "warning":
        return <FiAlertTriangle className="text-yellow-500" />;
      default:
        return <FiInfo className="text-blue-500" />;
    }
  };

  // Get appropriate icon for notification type
  const getNotificationTypeIcon = (type) => {
    if (type.includes("document")) {
      return <FiFileText className="text-gray-500" />;
    } else if (type.includes("form")) {
      return <FiClock className="text-purple-500" />;
    } else {
      return <FiInfo className="text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full p-8">
        <div className="animate-pulse text-lg">Loading notifications...</div>
      </div>
    );
  }

  const filtered = filteredNotifications();
  const hasNotifications = filtered.length > 0;

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold mb-2 md:mb-0">Notifications</h1>
        
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center">
            <FiFilter className="mr-2 text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-white border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Notifications</option>
              <option value="unread">Unread Only</option>
              <option value="document">Document Notifications</option>
              <option value="form">Form Notifications</option>
            </select>
          </div>
          
          {selectedNotifications.length > 0 ? (
            <>
              <button
                onClick={() => markAsRead(selectedNotifications)}
                className="bg-blue-600 text-white px-3 py-1 rounded flex items-center hover:bg-blue-700"
              >
                <FiCheck className="mr-1" /> Mark as Read
              </button>
              <button
                onClick={() => deleteNotifications(selectedNotifications)}
                className="bg-red-600 text-white px-3 py-1 rounded flex items-center hover:bg-red-700"
              >
                <FiTrash2 className="mr-1" /> Delete Selected
              </button>
            </>
          ) : (
            notifications.length > 0 && (
              <>
                <button
                  onClick={() => markAsRead(notifications.map(n => n._id))}
                  className="bg-gray-200 text-gray-800 px-3 py-1 rounded flex items-center hover:bg-gray-300"
                >
                  <FiCheck className="mr-1" /> Mark All as Read
                </button>
                <button
                  onClick={() => deleteNotifications(notifications.map(n => n._id))}
                  className="bg-gray-200 text-gray-800 px-3 py-1 rounded flex items-center hover:bg-gray-300"
                >
                  <FiTrash2 className="mr-1" /> Clear All
                </button>
              </>
            )
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-md text-red-600 mb-6">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {!hasNotifications ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <FiInfo className="mx-auto text-5xl text-blue-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No notifications</h2>
          <p className="text-gray-600">
            You don't have any notifications at this time.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex items-center">
            <input 
              type="checkbox" 
              checked={selectedNotifications.length === filtered.length && filtered.length > 0}
              onChange={toggleSelectAll}
              className="mr-3 h-4 w-4"
            />
            <span className="text-sm text-gray-500">
              {selectedNotifications.length} of {filtered.length} selected
            </span>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filtered.map((notification) => (
              <div 
                key={notification._id} 
                className={`p-4 ${notification.isRead ? "bg-white" : "bg-blue-50"} hover:bg-gray-50`}
              >
                <div className="flex">
                  <div className="mr-3">
                    <input 
                      type="checkbox" 
                      checked={selectedNotifications.includes(notification._id)}
                      onChange={() => toggleSelect(notification._id)}
                      className="h-4 w-4"
                    />
                  </div>
                  <div className="flex-shrink-0 mr-3 mt-1">
                    {getNotificationIcon(notification.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        {getNotificationTypeIcon(notification.type)}
                        <p className="ml-1 text-sm font-medium text-gray-900">{notification.title}</p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notification.description}</p>
                    
                    {notification.documentId && (
                      <div className="mt-2">
                        <a 
                          href={`/staff/review-document/${notification.documentId}`}
                          className="text-sm text-blue-600 hover:underline inline-flex items-center"
                        >
                          <FiFileText className="mr-1" /> 
                          {notification.documentName || "View Document"}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to format time ago
const formatTimeAgo = (timestamp) => {
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

export default StaffNotifications;