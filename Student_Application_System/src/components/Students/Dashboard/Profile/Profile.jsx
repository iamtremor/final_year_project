import React, { useState } from "react";
import { FaUserEdit, FaCamera, FaSave, FaFileAlt } from "react-icons/fa";

const Profile = () => {
  // State for profile information
  const [profile, setProfile] = useState({
    name: "Adesuwa Angela",
    email: "adesuwa@babcock.com",
    appID: "150981",
    phone: "+234 812 345 6789",
    birthdate: "2007-06-12",
    department: "Computer Science",
    profileImage: "https://via.placeholder.com/150",
  });

  const [isEditing, setIsEditing] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  // Handle profile image change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageURL = URL.createObjectURL(file);
      setProfile((prev) => ({ ...prev, profileImage: imageURL }));
    }
  };

  // Dummy submission history
  const submissionHistory = [
    { id: 1, name: "WAEC Result", status: "Approved", date: "2025-03-12" },
    { id: 2, name: "Birth Certificate", status: "Pending", date: "2025-03-14" },
    { id: 3, name: "JAMB Result", status: "Declined", date: "2025-03-10" },
  ];

  return (
    <div className="max-w-3xl mx-auto mt-8 p-6 bg-white shadow-lg rounded-lg">
      {/* Header */}
      <h1 className="text-xl font-bold text-[#0D0637]">Student Profile</h1>
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
        {[
          {
            label: "Full Name",
            name: "name",
            type: "text",
            value: profile.name,
          },
          {
            label: "Email",
            name: "email",
            type: "email",
            value: profile.email,
          },
          {
            label: "App ID",
            name: "appID",
            type: "text",
            value: profile.appID,
            disabled: true,
          },
          { label: "Phone", name: "phone", type: "text", value: profile.phone },
          {
            label: "Date of Birth",
            name: "birthdate",
            type: "date",
            value: profile.birthdate,
          },
          {
            label: "Department",
            name: "department",
            type: "text",
            value: profile.department,
            disabled: true,
          },
        ].map((field, index) => (
          <div key={index} className="flex items-center border p-2 rounded-md">
            <h1 className="font-semibold w-40">{field.label}</h1>
            <input
              type={field.type}
              name={field.name}
              value={field.value}
              onChange={handleChange}
              disabled={field.disabled || !isEditing}
              className={`border rounded-md p-2 w-full ${
                isEditing && !field.disabled ? "bg-white" : "bg-gray-100"
              }`}
            />
          </div>
        ))}
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

export default Profile;