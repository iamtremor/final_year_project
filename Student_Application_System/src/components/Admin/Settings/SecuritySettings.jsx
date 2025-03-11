import React, { useState } from "react";
import { FaLock, FaShieldAlt } from "react-icons/fa";

const SecuritySettings = () => {
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    console.log("Password changed:", passwordData);
    // Submit password change to backend
  };

  const toggle2FA = () => {
    setIs2FAEnabled(!is2FAEnabled);
  };

  return (
    <div className="bg-white shadow-lg p-6 rounded-lg w-full md:w-2/3 lg:w-1/2">
      <h3 className="text-xl font-bold text-[#0D0637] mb-4 flex items-center">
        <FaLock className="mr-2" /> Change Password
      </h3>

      <form onSubmit={handlePasswordSubmit}>
        <div className="mb-4">
          <label className="block text-[#0D0637] font-semibold mb-2">
            Current Password
          </label>
          <input
            type="password"
            name="currentPassword"
            value={passwordData.currentPassword}
            onChange={handlePasswordChange}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-[#0D0637] font-semibold mb-2">
            New Password
          </label>
          <input
            type="password"
            name="newPassword"
            value={passwordData.newPassword}
            onChange={handlePasswordChange}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-[#0D0637] font-semibold mb-2">
            Confirm New Password
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={passwordData.confirmPassword}
            onChange={handlePasswordChange}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>

        <button
          type="submit"
          className="bg-[#C3A135] text-white px-4 py-2 rounded hover:bg-[#a4862a]"
        >
          Update Password
        </button>
      </form>
    </div>
  );
};

export default SecuritySettings;
