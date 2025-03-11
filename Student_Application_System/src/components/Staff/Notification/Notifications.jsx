import React, { useState } from "react";
import { IoMdNotificationsOutline } from "react-icons/io";
import { AiOutlineCheckCircle, AiOutlineDelete } from "react-icons/ai";

const initialNotifications = [
  {
    id: 1,
    message: "New document pending approval: WAEC Result for Adesuwa Angela.",
    type: "Pending Approval",
    date: "March 5, 2025",
    read: false,
  },
  {
    id: 2,
    message: "Document approved: Birth Certificate for John Doe.",
    type: "Approved",
    date: "March 4, 2025",
    read: true,
  },
  {
    id: 3,
    message:
      "Document rejected: Transcript for Jane Smith. Reason: Low-quality scan.",
    type: "Rejected",
    date: "March 3, 2025",
    read: false,
  },
];

const StaffNotifications = () => {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false); // Toggle Read/Unread

  const toggleReadStatus = (id) => {
    setNotifications((prevNotifications) =>
      prevNotifications.map((notif) =>
        notif.id === id ? { ...notif, read: !notif.read } : notif
      )
    );
  }; // Clear All Notifications

  const clearNotifications = () => {
    setNotifications([]);
  }; // Filter Unread Notifications

  const filteredNotifications = showUnreadOnly
    ? notifications.filter((notif) => !notif.read)
    : notifications;

  return (
    <div className="p-6">
      {/* Header */}

      <div className="flex items-center mb-4">
        <IoMdNotificationsOutline size={30} className="text-[#0D0637] mr-2" />

        <h2 className="text-2xl font-bold text-[#0D0637]">
          Staff Notifications
        </h2>
      </div>
      {/* Actions */}

      <div className="flex justify-between mb-4">
        <button
          className="bg-[#C3A135] text-white px-4 py-2 rounded-md"
          onClick={() => setShowUnreadOnly(!showUnreadOnly)}
        >
          {showUnreadOnly ? "Show All" : "Show Unread Only"}
        </button>

        <button
          className="bg-red-500 text-white px-4 py-2 rounded-md flex items-center"
          onClick={clearNotifications}
        >
          <AiOutlineDelete className="mr-2" /> Clear All
        </button>
      </div>
      {/* Notifications List */}

      <ul className="space-y-3">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notif) => (
            <li
              key={notif.id}
              className={`p-4 rounded-md shadow-md flex justify-between items-center ${
                notif.read ? "bg-gray-200" : "bg-white"
              }`}
            >
              <div>
                <p className="text-sm text-gray-600">{notif.date}</p>
                <p className="font-medium">{notif.message}</p>

                <span
                  className={`text-xs font-semibold ${
                    notif.type === "Pending Approval"
                      ? "text-yellow-600"
                      : notif.type === "Approved"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {notif.type}
                </span>
              </div>

              <button
                className={`px-3 py-1 rounded-md ${
                  notif.read
                    ? "bg-gray-500 text-white"
                    : "bg-blue-500 text-white"
                }`}
                onClick={() => toggleReadStatus(notif.id)}
              >
                {notif.read ? "Mark as Unread" : "Mark as Read"}
              </button>
            </li>
          ))
        ) : (
          <p className="text-gray-500 text-center">
            No notifications available.
          </p>
        )}
      </ul>
    </div>
  );
};

export default StaffNotifications;
