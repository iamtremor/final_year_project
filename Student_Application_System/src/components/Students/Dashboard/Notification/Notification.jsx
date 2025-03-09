import React, { useState } from "react";
import { IoMdNotificationsOutline } from "react-icons/io";
const Notification = () => {
  // Sample notification data
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Transcript Approved",
      description: "Your transcript has been approved successfully.",
      timestamp: "2025-01-07, 10:00 AM",
      status: "success", // success, warning, or error
      isRead: false, // New field to track read/unread status
    },
    {
      id: 2,
      title: "Admission Letter Uploaded",
      description: "Your admission letter was uploaded for review.",
      timestamp: "2025-01-06, 3:45 PM",
      status: "warning",
      isRead: true,
    },
    {
      id: 3,
      title: "Medical Report Rejected",
      description: "Your medical report was rejected. Please re-upload.",
      timestamp: "2025-01-05, 1:30 PM",
      status: "error",
      isRead: false,
    },
  ]);

  // Function to mark all notifications as read
  const markAllAsRead = () => {
    const updatedNotifications = notifications.map((notification) => ({
      ...notification,
      isRead: true,
    }));
    setNotifications(updatedNotifications);
  };

  // Function to clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Function to toggle read/unread for a single notification
  const toggleReadStatus = (id) => {
    const updatedNotifications = notifications.map((notification) =>
      notification.id === id
        ? { ...notification, isRead: !notification.isRead }
        : notification
    );
    setNotifications(updatedNotifications);
  };

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-2xl font-bold text-[#1E3A8A]  flex items-center">
          <IoMdNotificationsOutline />
          <h2 className="mx-2">Notifications</h2>
        </div>
        <div className="flex gap-4">
          <button
            onClick={markAllAsRead}
            className="text-sm text-green-500 hover:text-green-700"
          >
            Mark All as Read
          </button>
          <button
            onClick={clearAllNotifications}
            className="text-sm text-red-500 hover:text-red-700"
          >
            Clear All Notifications
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg shadow-lg flex items-start ${
                notification.status === "success"
                  ? "bg-green-100 border-l-4 border-green-500"
                  : notification.status === "warning"
                  ? "bg-yellow-100 border-l-4 border-yellow-500"
                  : "bg-red-100 border-l-4 border-red-500"
              }`}
            >
              <div className="flex-grow">
                <h3
                  className={`text-lg font-bold ${
                    notification.isRead ? "text-gray-500" : "text-[#1E3A8A]"
                  }`}
                >
                  {notification.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {notification.description}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {notification.timestamp}
                </p>
              </div>
              <button
                onClick={() => toggleReadStatus(notification.id)}
                className="text-sm text-blue-500 hover:text-blue-700 ml-4"
              >
                {notification.isRead ? "Mark as Unread" : "Mark as Read"}
              </button>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No notifications available.</p>
        )}
      </div>
    </div>
  );
};

export default Notification;
