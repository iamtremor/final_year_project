import React, { useState, useEffect } from "react";
import { FiUser, FiMail, FiPhone, FiCalendar, FiEdit, FiSave, FiXCircle, FiCheck, FiUserPlus } from "react-icons/fi";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../utils/api";

const StaffProfile = () => {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    department: "",
    dateOfBirth: ""
  });
  const [managedDepartments, setManagedDepartments] = useState([]);
  const [availableDepartments, setAvailableDepartments] = useState([
    "Computer Science",
    "Electrical Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
    "Medicine",
    "Pharmacy",
    "Business Administration",
    "Economics",
    "Law",
    "Psychology"
  ]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await api.get("/users/profile");
        setProfile(response.data);
        
        // Initialize form data with profile data
        setFormData({
          fullName: response.data.fullName || "",
          email: response.data.email || "",
          phoneNumber: response.data.phoneNumber || "",
          department: response.data.department || "",
          dateOfBirth: response.data.dateOfBirth 
            ? new Date(response.data.dateOfBirth).toISOString().split("T")[0] 
            : ""
        });
        
        // Initialize managed departments
        if (response.data.managedDepartments) {
          setManagedDepartments(response.data.managedDepartments);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Failed to load profile information. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
        fetchProfile();
      }
    }, [isAuthenticated]);
  
    // Handle form input changes
    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData({
        ...formData,
        [name]: value
      });
    };
  
    // Handle form submission
    const handleSubmit = async (e) => {
      e.preventDefault();
      
      try {
        setError(null);
        
        // Prepare data for submission
        const updateData = {
          ...formData,
          managedDepartments
        };
        
        // Send update request
        const response = await api.put("/users/profile", updateData);
        
        // Update profile state with response data
        setProfile(response.data);
        
        // Exit edit mode
        setIsEditing(false);
      } catch (err) {
        console.error("Error updating profile:", err);
        setError("Failed to update profile. Please try again later.");
      }
    };
  
    // Toggle department management
    const toggleDepartment = (dept) => {
      if (managedDepartments.includes(dept)) {
        setManagedDepartments(managedDepartments.filter(d => d !== dept));
      } else {
        setManagedDepartments([...managedDepartments, dept]);
      }
    };
  
    if (loading) {
      return (
        <div className="flex justify-center items-center h-full p-8">
          <div className="animate-pulse text-lg">Loading profile...</div>
        </div>
      );
    }
  
    if (error && !profile) {
      return (
        <div className="bg-red-50 p-4 rounded-md text-red-600 m-4">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      );
    }
  
    return (
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-2xl font-bold mb-2 md:mb-0">Staff Profile</h1>
          
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded flex items-center hover:bg-blue-700"
            >
              <FiEdit className="mr-2" /> Edit Profile
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleSubmit}
                className="bg-green-600 text-white px-4 py-2 rounded flex items-center hover:bg-green-700"
              >
                <FiSave className="mr-2" /> Save Changes
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded flex items-center hover:bg-gray-700"
              >
                <FiXCircle className="mr-2" /> Cancel
              </button>
            </div>
          )}
        </div>
  
        {error && (
          <div className="bg-red-50 p-4 rounded-md text-red-600 mb-6">
            <p className="font-semibold">Error</p>
            <p>{error}</p>
          </div>
        )}
  
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <div className="flex items-center mb-6">
              <div className="bg-blue-100 p-4 rounded-full text-blue-500 text-3xl mr-4">
                <FiUser />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{profile?.fullName}</h2>
                <p className="text-gray-600">{profile?.department}</p>
              </div>
            </div>
  
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
              
              {isEditing ? (
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="staffId" className="block text-sm font-medium text-gray-700 mb-1">
                        Staff ID
                      </label>
                      <input
                        type="text"
                        id="staffId"
                        value={profile?.staffId || ""}
                        className="w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100"
                        disabled
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phoneNumber"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                        Department
                      </label>
                      <input
                        type="text"
                        id="department"
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100"
                        disabled
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        id="dateOfBirth"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Only show managed departments section for school officers */}
                  {profile?.department && !profile.department.includes('HOD') && 
                  !['Registrar', 'Student Support', 'Finance', 'Health Services', 'Library'].includes(profile.department) && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-4">Managed Departments</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        As a School Officer, you can select which departments you can approve documents for:
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {managedDepartments.map(dept => (
                          <div 
                            key={dept}
                            className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center"
                          >
                            {dept}
                            <button 
                              type="button"
                              onClick={() => toggleDepartment(dept)}
                              className="ml-2 text-blue-500 hover:text-blue-700"
                            >
                              <FiXCircle />
                            </button>
                          </div>
                        ))}
                        
                        {managedDepartments.length === 0 && (
                          <p className="text-gray-500 italic">No departments selected</p>
                        )}
                      </div>
                      
                      <div className="mt-2">
                        <label htmlFor="addDepartment" className="block text-sm font-medium text-gray-700 mb-1">
                          Add Department
                        </label>
                        <div className="flex space-x-2">
                          <select
                            id="addDepartment"
                            className="flex-1 border border-gray-300 rounded-md shadow-sm p-2"
                            value=""
                            onChange={(e) => {
                              if (e.target.value) {
                                toggleDepartment(e.target.value);
                                e.target.value = "";
                              }
                            }}
                          >
                            <option value="">Select department...</option>
                            {availableDepartments
                              .filter(dept => !managedDepartments.includes(dept))
                              .map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                              ))
                            }
                          </select>
                          <button
                            type="button"
                            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center hover:bg-blue-700"
                            onClick={() => {
                              const select = document.getElementById("addDepartment");
                              if (select.value) {
                                toggleDepartment(select.value);
                                select.value = "";
                              }
                            }}
                          >
                            <FiUserPlus className="mr-2" /> Add
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600">Full Name</p>
                    <p className="font-medium flex items-center">
                      <FiUser className="mr-2 text-gray-500" /> {profile?.fullName}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Staff ID</p>
                    <p className="font-medium flex items-center">
                      <FiCheck className="mr-2 text-gray-500" /> {profile?.staffId || "N/A"}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Email Address</p>
                    <p className="font-medium flex items-center">
                      <FiMail className="mr-2 text-gray-500" /> {profile?.email}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Phone Number</p>
                    <p className="font-medium flex items-center">
                      <FiPhone className="mr-2 text-gray-500" /> {profile?.phoneNumber || "N/A"}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Department</p>
                    <p className="font-medium">{profile?.department || "N/A"}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Date of Birth</p>
                    <p className="font-medium flex items-center">
                      <FiCalendar className="mr-2 text-gray-500" /> 
                      {profile?.dateOfBirth 
                        ? new Date(profile.dateOfBirth).toLocaleDateString() 
                        : "N/A"}
                    </p>
                  </div>
                  
                  {/* Only show managed departments for school officers */}
                  {profile?.department && !profile.department.includes('HOD') && 
                  !['Registrar', 'Student Support', 'Finance', 'Health Services', 'Library'].includes(profile.department) && (
                    <div className="col-span-2 mt-4">
                      <h3 className="text-lg font-semibold mb-2">Managed Departments</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        You can approve documents from students in the following departments:
                      </p>
                      
                      {profile?.managedDepartments && profile.managedDepartments.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {profile.managedDepartments.map(dept => (
                            <div 
                              key={dept}
                              className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full"
                            >
                              {dept}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">No departments assigned</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Account Information Section */}
            <div className="border-t mt-6 pt-6">
              <h3 className="text-lg font-semibold mb-4">Account Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Account Status</p>
                  <p className="font-medium flex items-center">
                    <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span> Active
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Role</p>
                  <p className="font-medium">{profile?.role || "Staff"}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Account Created</p>
                  <p className="font-medium">
                    {profile?.createdAt 
                      ? new Date(profile.createdAt).toLocaleDateString() 
                      : "N/A"}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Last Login</p>
                  <p className="font-medium">Today at {new Date().toLocaleTimeString()}</p>
                </div>
              </div>
              
              <div className="mt-6">
                <button className="text-blue-600 hover:underline">
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  export default StaffProfile;