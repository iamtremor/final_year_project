import React, { useState } from "react";
import { FaUserEdit, FaCamera, FaSave } from "react-icons/fa";

const StaffProfile = () => {
  const [profile, setProfile] = useState({
    name: "Mr. Soji",
    email: "soji@babcock.edu.ng",
    staffID: "BU/STAFF/5678",
    phone: "+234 812 345 6789",
    department: "Registry",
    profileImage: "https://via.placeholder.com/150",
  });

  const [isEditing, setIsEditing] = useState(false); // Handle form input changes

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  }; // Handle profile image change

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageURL = URL.createObjectURL(file);
      setProfile((prev) => ({ ...prev, profileImage: imageURL }));
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-8 p-6 bg-white shadow-lg rounded-lg">
      {/* Header */}
      <h1 className="text-xl font-bold text-[#0D0637]">Staff Profile</h1>

      <p className="text-sm text-gray-500">Manage your personal information</p>
      {/* Profile Picture Upload */}

      <div className="flex flex-col items-center mt-4">
        <div className="relative">
          <img
            src={profile.profileImage}
            alt="Profile"
            className="w-24 h-24 rounded-full border-4 border-[#C3A135]"
          />

          <label
            htmlFor="profileImage"
            className="absolute bottom-0 right-0 bg-[#C3A135] p-2 rounded-full cursor-pointer"
          >
            <FaCamera className="text-white" />

            <input
              type="file"
              id="profileImage"
              className="hidden"
              accept="image/*"
              onChange={handleImageChange}
            />
          </label>
        </div>
      </div>
      {/* Profile Details */}

      <div className="mt-6 space-y-4">
        <div className="flex items-center border p-2 rounded-md">
          <h1 className="font-semibold w-40">Full Name</h1>

          <input
            type="text"
            name="name"
            value={profile.name}
            onChange={handleChange}
            disabled={!isEditing}
            className={`border rounded-md p-2 w-full ${
              isEditing ? "bg-white" : "bg-gray-100"
            }`}
          />
        </div>

        <div className="flex items-center border p-2 rounded-md">
          <h1 className="font-semibold w-40">Email</h1>

          <input
            type="email"
            name="email"
            value={profile.email}
            onChange={handleChange}
            disabled={!isEditing}
            className={`border rounded-md p-2 w-full ${
              isEditing ? "bg-white" : "bg-gray-100"
            }`}
          />
        </div>

        <div className="flex items-center border p-2 rounded-md">
          <h1 className="font-semibold w-40">Staff ID</h1>

          <input
            type="text"
            name="staffID"
            value={profile.staffID}
            disabled
            className="border rounded-md p-2 w-full bg-gray-100"
          />
        </div>

        <div className="flex items-center border p-2 rounded-md">
          <h1 className="font-semibold w-40">Phone</h1>

          <input
            type="text"
            name="phone"
            value={profile.phone}
            onChange={handleChange}
            disabled={!isEditing}
            className={`border rounded-md p-2 w-full ${
              isEditing ? "bg-white" : "bg-gray-100"
            }`}
          />
        </div>

        <div className="flex items-center border p-2 rounded-md">
          <h1 className="font-semibold w-40">Department</h1>

          <input
            type="text"
            name="department"
            value={profile.department}
            disabled
            className="border rounded-md p-2 w-full bg-gray-100"
          />
        </div>
      </div>
      {/* Action Buttons */}

      <div className="mt-6 flex justify-between">
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="bg-[#C3A135] text-white px-4 py-2 rounded-md flex items-center gap-2"
        >
          <FaUserEdit />
          {isEditing ? "Cancel Edit" : "Edit Profile"}
        </button>

        {isEditing && (
          <button className="bg-[#0D0637] text-white px-4 py-2 rounded-md flex items-center gap-2">
            <FaSave />
            Save Changes
          </button>
        )}
      </div>
    </div>
  );
};

export default StaffProfile;
