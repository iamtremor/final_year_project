import React, { useState } from "react";
import { FaUserEdit, FaLock, FaBell, FaPalette, FaKey } from "react-icons/fa";
import ProfileSettings from "./ProfileSettings";
import SecuritySettings from "./SecuritySettings";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("Profile");

  // Tab change handler
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-[#0D0637] mb-4">
        System Settings
      </h2>

      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => handleTabChange("Profile")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md ${
            activeTab === "Profile"
              ? "bg-[#C3A135] text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          <FaUserEdit /> Profile Settings
        </button>
        <button
          onClick={() => handleTabChange("Security")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md ${
            activeTab === "Security"
              ? "bg-[#C3A135] text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          <FaLock /> Security Settings
        </button>
      </div>

      {/* Render Forms Based on Active Tab */}
      {activeTab === "Profile" && <ProfileSettings />}
      {activeTab === "Security" && <SecuritySettings />}
      {/* {activeTab === "Notifications" && <NotificationSettings />} */}
    </div>
  );
};

export default Settings;
