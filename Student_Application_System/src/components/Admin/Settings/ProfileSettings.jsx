import React, { useState } from "react";

const ProfileSettings = () => {
  const [profileData, setProfileData] = useState({
    name: "Admin User",
    email: "admin@system.com",
    profilePicture: null,
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "profilePicture") {
      setProfileData({
        ...profileData,
        profilePicture: URL.createObjectURL(files[0]),
      });
    } else {
      setProfileData({ ...profileData, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Updated Profile Data:", profileData); // Submit updated profile data to backend
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white shadow-lg p-6 rounded-lg w-full md:w-2/3 lg:w-1/2"
    >
      {/* Profile Picture */}

      <div className="mb-4">
        <label className="block text-[#0D0637] font-semibold mb-2">
          Profile Picture
        </label>

        <input
          type="file"
          name="profilePicture"
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded"
        />

        {profileData.profilePicture && (
          <img
            src={profileData.profilePicture}
            alt="Profile"
            className="mt-2 w-20 h-20 rounded-full"
          />
        )}
      </div>
      {/* Name */}

      <div className="mb-4">
        <label className="block text-[#0D0637] font-semibold mb-2">Name</label>

        <input
          type="text"
          name="name"
          value={profileData.name}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded"
        />
      </div>
      {/* Email */}

      <div className="mb-4">
        <label className="block text-[#0D0637] font-semibold mb-2">Email</label>

        <input
          type="email"
          name="email"
          value={profileData.email}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded"
        />
      </div>
      {/* Submit Button */}

      <button
        type="submit"
        className="bg-[#C3A135] text-white px-4 py-2 rounded hover:bg-[#a4862a]"
      >
        Save Changes
      </button>
    </form>
  );
};

export default ProfileSettings;
