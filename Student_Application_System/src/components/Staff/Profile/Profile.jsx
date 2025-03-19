import React, { useState, useEffect } from "react";
import { 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiCalendar, 
  FiEdit, 
  FiSave, 
  FiXCircle, 
  FiCheck, 
  FiUserPlus,
  FiShield,
  FiBookmark,
  FiInfo
} from "react-icons/fi";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../utils/api";
import toast, { Toaster } from "react-hot-toast";

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
  const [documentStats, setDocumentStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0
  });

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

        // Fetch document statistics
        try {
          const statsResponse = await api.get("/dashboard/staff");
          setDocumentStats({
            total: statsResponse.data.stats.pendingApprovals.documents + statsResponse.data.stats.completedApprovals.documents,
            approved: statsResponse.data.stats.completedApprovals.documents,
            pending: statsResponse.data.stats.pendingApprovals.documents,
            rejected: 0 // Assuming there's no rejected stats yet
          });
        } catch (statsError) {
          console.error("Error fetching document stats:", statsError);
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
      toast.success("Profile updated successfully");
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile. Please try again later.");
      toast.error("Failed to update profile");
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
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (error) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1E3A8A]"></div>
        <span className="ml-3 text-gray-600">Loading profile data...</span>
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
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#1E3A8A] flex items-center">
          <FiUser className="mr-2" />
          Profile Information
        </h2>
        <p className="text-gray-600 mt-1">
          Your personal information and account details
        </p>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 p-4 rounded-md text-red-600 mb-6">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      <div className="flex flex-col lg:flex-row justify-between mb-6">
        <div className="lg:mr-6 lg:w-1/3">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col items-center">
              <div className="h-32 w-32 rounded-full border-4 border-[#1E3A8A] mb-4 overflow-hidden">
                <img 
                  src={profile.profileImage || "https://via.placeholder.com/150"} 
                  alt="Profile" 
                  className="h-full w-full object-cover"
                />
              </div>
              <h3 className="text-lg font-medium text-gray-900">{profile.fullName}</h3>
              <p className="text-sm text-gray-500">{profile.department}</p>
              <div className="mt-3 py-1 px-3 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                Active
              </div>
            </div>
            
            <div className="mt-6 border-t pt-4">
              <div className="flex items-center py-2">
                <FiShield className="text-gray-400 mr-3" />
                <div>
                  <p className="text-xs text-gray-500">Staff ID</p>
                  <p className="text-sm font-medium">{profile.staffId}</p>
                </div>
              </div>
              
              <div className="flex items-center py-2">
                <FiCalendar className="text-gray-400 mr-3" />
                <div>
                  <p className="text-xs text-gray-500">Joined</p>
                  <p className="text-sm font-medium">{formatDate(profile.createdAt) || "N/A"}</p>
                </div>
              </div>
            </div>
            
            {/* Edit Profile Button */}
            <div className="mt-4">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#1E3A8A] hover:bg-[#152a63] focus:outline-none"
                >
                  <FiEdit className="mr-2" /> Edit Profile
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="w-1/2 flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                  >
                    <FiXCircle className="mr-2" /> Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="w-1/2 flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none"
                  >
                    <FiSave className="mr-2" /> Save
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Documents Summary Card */}
          
        </div>
        
        {/* Right Column - Main Content */}
        <div className="lg:flex-1 mt-6 lg:mt-0">
          {/* Personal Information Card */}
          {isEditing ? (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Personal Information</h3>
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A]"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="staffId" className="block text-sm font-medium text-gray-700 mb-1">
                      Staff ID
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="staffId"
                        value={profile?.staffId || ""}
                        className="w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100"
                        disabled
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <div className="mt-1">
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A]"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <div className="mt-1">
                      <input
                        type="tel"
                        id="phoneNumber"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A]"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <div className="mt-1">
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
                  </div>
                  
                  <div>
                    <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth
                    </label>
                    <div className="mt-1">
                      <input
                        type="date"
                        id="dateOfBirth"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A]"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                {/* Only show managed departments section for school officers */}
                {profile?.department && !profile.department.includes('HOD') && 
                !['Registrar', 'Student Support', 'Finance', 'Health Services', 'Library'].includes(profile.department) && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-4">Managed Departments</h3>
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
                          className="flex-1 border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A]"
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
                          className="bg-[#1E3A8A] text-white px-4 py-2 rounded flex items-center hover:bg-[#152a63]"
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
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
              
              <div className="space-y-4">
                {/* Full Name */}
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center">
                    <FiUser className="text-[#1E3A8A] mr-3" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Full Name</p>
                      <p className="font-medium">{profile?.fullName}</p>
                    </div>
                  </div>
                </div>
                
                {/* Email */}
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center">
                    <FiMail className="text-[#1E3A8A] mr-3" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Email Address</p>
                      <p className="font-medium">{profile?.email}</p>
                    </div>
                  </div>
                </div>
                
                {/* Phone */}
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center">
                    <FiPhone className="text-[#1E3A8A] mr-3" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Phone Number</p>
                      <p className="font-medium">{profile?.phoneNumber}</p>
                    </div>
                  </div>
                </div>
                
                {/* Date of Birth */}
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center">
                    <FiCalendar className="text-[#1E3A8A] mr-3" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Date of Birth</p>
                      <p className="font-medium">{formatDate(profile?.dateOfBirth)}</p>
                    </div>
                  </div>
                </div>
                
                {/* Department */}
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center">
                    <FiBookmark className="text-[#1E3A8A] mr-3" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Department</p>
                      <p className="font-medium">{profile?.department}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Account Security Card */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Account Security</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-md">
                <div>
                  <h4 className="font-medium">Password</h4>
                  <p className="text-sm text-gray-500">
                    Last changed: Never
                  </p>
                </div>
                <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
                  Change Password
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-md">
                <div>
                  <h4 className="font-medium">Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-500">
                    Enhanced security for your account
                  </p>
                </div>
                <div className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md cursor-not-allowed">
                  Not Available
                </div>
              </div>
            </div>
          </div>
          
          {/* Managed Departments Section (If Applicable) */}
          {!isEditing && profile?.managedDepartments && profile.managedDepartments.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Managed Departments</h3>
              <p className="text-sm text-gray-600 mb-3">
                You can approve documents from students in the following departments:
              </p>
              
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
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
export default StaffProfile;