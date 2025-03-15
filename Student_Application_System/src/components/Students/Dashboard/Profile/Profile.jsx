import React, { useState, useEffect } from "react";
import { 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiCalendar, 
  FiBookmark,
  FiShield,
  FiInfo
} from "react-icons/fi";
import { useAuth } from "../../../../context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import api from "../../../../utils/api";

const Profile = () => {
  const { user } = useAuth();
  const [documentStats, setDocumentStats] = useState({
      total: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
      onBlockchain: 0
    });
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    applicationId: "",
    phoneNumber: "",
    birthdate: "",
    department: "",
    profileImage: "https://via.placeholder.com/150"
  });
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [blockchainDocuments, setBlockchainDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWithinDeadline, setIsWithinDeadline] = useState(true);
  
  // Fetch user profile data on component mount
  useEffect(() => {
    fetchProfileData();
  }, []);
  useEffect(() => {
    const fetchDocumentStats = async () => {
      try {
        setIsLoading(true);
        
        // Get all documents for the student
        const response = await api.get('/documents/student');
        const docs = response.data;
        setDocuments(docs);
        
        // Calculate stats
        const approved = docs.filter(doc => doc.status === 'approved').length;
        const pending = docs.filter(doc => doc.status === 'pending').length;
        const rejected = docs.filter(doc => doc.status === 'rejected').length;
        
        // Get blockchain verified documents
        const blockchainResponse = await api.get(`/blockchain/student-documents/${user.applicationId}`);
        const blockchainDocs = blockchainResponse.data.documents || [];
        setBlockchainDocuments(blockchainDocs);
        
        setDocumentStats({
          total: docs.length,
          approved,
          pending,
          rejected,
          onBlockchain: blockchainDocs.length
        });
        
        // Check deadline
        if (user?.applicationId) {
          const deadlineResponse = await api.get(
            `/blockchain/applications/within-deadline/${user.applicationId}`
          );
          setIsWithinDeadline(deadlineResponse.data.isWithinDeadline);
        }
      } catch (error) {
        console.error("Error fetching document stats:", error);
        // Set some default values if there's an error
        setDocumentStats({
          total: 0,
          approved: 0,
          pending: 0,
          onBlockchain: 0
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchDocumentStats();
    }
  }, [user]);
  // Function to fetch profile data - in a real app, this would call an API
  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, you would call your API:
      // const response = await api.get('/users/profile', {
      //   headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      // });
      // setProfile(response.data);
      
      // For now, we'll use the existing sample data but with the user data from context
      setProfile({
        fullName: user?.fullName || "Adesuwa Angela",
        email: user?.email || "adesuwa@babcock.com",
        applicationId: user?.applicationId || "150981",
        phoneNumber: "+234 812 345 6789",
        birthdate: "2007-06-12",
        department: user?.department || "Computer Science",
        profileImage: "https://via.placeholder.com/150",
        // Additional fields for enhanced UI
        joinDate: "2024-01-15",
        accountStatus: "Active",
        documentCount: 5,
        approvedDocuments: 3,
        pendingDocuments: 2,
        rejectedDocuments: 0
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
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
      
      {/* Loading state */}
      {loading && (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1E3A8A] mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading profile data...</p>
        </div>
      )}
      
      {/* Profile content */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Picture and Basic Info */}
          <div className="col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex flex-col items-center">
                <div className="h-32 w-32 rounded-full border-4 border-[#1E3A8A] mb-4 overflow-hidden">
                  <img 
                    src={profile.profileImage} 
                    alt="Profile" 
                    className="h-full w-full object-cover"
                  />
                </div>
                <h3 className="text-lg font-medium text-gray-900">{profile.fullName}</h3>
                <p className="text-sm text-gray-500">{profile.department}</p>
                <div className="mt-3 py-1 px-3 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  {profile.accountStatus}
                </div>
              </div>
              
              <div className="mt-6 border-t pt-4">
                <div className="flex items-center py-2">
                  <FiShield className="text-gray-400 mr-3" />
                  <div>
                    <p className="text-xs text-gray-500">Application ID</p>
                    <p className="text-sm font-medium">{profile.applicationId}</p>
                  </div>
                </div>
                
                <div className="flex items-center py-2">
                  <FiCalendar className="text-gray-400 mr-3" />
                  <div>
                    <p className="text-xs text-gray-500">Joined</p>
                    <p className="text-sm font-medium">{formatDate(profile.joinDate)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Documents Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">Documents Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Total Documents</span>
                  <span className="text-sm font-medium">{documentStats.total}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Approved</span>
                  <span className="text-sm font-medium text-green-600">{documentStats.approved}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Pending</span>
                  <span className="text-sm font-medium text-yellow-600">{documentStats.pending}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Rejected</span>
                  <span className="text-sm font-medium text-red-600">{documentStats.rejected}</span>
                </div>
              </div>
              
              <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-blue-500"
                  style={{ width: `${(documentStats.approved / documentStats.total) * 100}%` }}
                ></div>
              </div>
              <p className="mt-2 text-xs text-center text-gray-500">
                {Math.round((documentStats.approved / documentStats.total) * 100)}% of documents approved
              </p>
            </div>
          </div>
          
          {/* Right Column - Detailed Information */}
          <div className="col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
              
              <div className="space-y-4">
                {/* Full Name */}
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center">
                    <FiUser className="text-[#1E3A8A] mr-3" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Full Name</p>
                      <p className="font-medium">{profile.fullName}</p>
                    </div>
                  </div>
                </div>
                
                {/* Email */}
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center">
                    <FiMail className="text-[#1E3A8A] mr-3" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Email Address</p>
                      <p className="font-medium">{profile.email}</p>
                    </div>
                  </div>
                </div>
                
                {/* Phone */}
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center">
                    <FiPhone className="text-[#1E3A8A] mr-3" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Phone Number</p>
                      <p className="font-medium">{profile.phoneNumber}</p>
                    </div>
                  </div>
                </div>
                
                {/* Date of Birth */}
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center">
                    <FiCalendar className="text-[#1E3A8A] mr-3" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Date of Birth</p>
                      <p className="font-medium">{formatDate(profile.birthdate)}</p>
                    </div>
                  </div>
                </div>
                
                {/* Department */}
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center">
                    <FiBookmark className="text-[#1E3A8A] mr-3" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Department</p>
                      <p className="font-medium">{profile.department}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex items-center bg-blue-50 p-4 rounded-md">
                <FiInfo className="text-blue-500 mr-3" />
                <p className="text-sm text-blue-700">
                  To update your profile information, please contact the administrator.
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Account Security</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-md">
                  <div>
                    <h4 className="font-medium">Password</h4>
                    <p className="text-sm text-gray-500">
                      Last changed: Never
                    </p>
                  </div>
                  <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md cursor-not-allowed" disabled>
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
                  <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md cursor-not-allowed" disabled>
                    Not Available
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;