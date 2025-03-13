import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { FaUserPlus, FaEdit, FaTrash, FaSearch, FaEthereum, FaCheck, FaRegClock, FaTimesCircle, FaFilter } from "react-icons/fa";
import { FiExternalLink, FiUsers } from "react-icons/fi";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { Link } from "react-router-dom";
import AddUserModal from "./AddUsers";
import ViewDetailsModal from "./ViewDetails";

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeRole, setActiveRole] = useState("all"); // For role filtering: "all", "student", "staff", "admin"
  const [blockchainStats, setBlockchainStats] = useState({
    total: 0,
    registered: 0,
    pending: 0,
    failed: 0,
    students: { total: 0, registered: 0, pending: 0, failed: 0 },
    staff: { total: 0, registered: 0, pending: 0, failed: 0 },
    admins: { total: 0, registered: 0, pending: 0, failed: 0 }
  });
  
  // Fetch all users data with blockchain status
  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error("Authentication token not found");
        setLoading(false);
        return;
      }
      
      // Fetch all users with blockchain status from the enhanced endpoint
      const response = await axios.get('/api/blockchain/users/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log("User status data:", response.data);
      
      if (response.data.users) {
        setUsers(response.data.users);
        setFilteredUsers(response.data.users);
      }
      
      if (response.data.stats) {
        setBlockchainStats(response.data.stats);
      }
      
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
      
      // Fallback to original endpoint if the enhanced one fails
      try {
        const fallbackResponse = await axios.get('/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        setUsers(fallbackResponse.data);
        setFilteredUsers(fallbackResponse.data);
      } catch (fallbackError) {
        console.error("Fallback fetch also failed:", fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllUsers();
  }, []);

  // Handle search and role filtering
  useEffect(() => {
    let result = users;
    
    // First filter by role if not "all"
    if (activeRole !== "all") {
      result = result.filter(user => user.role === activeRole);
    }
    
    // Then filter by search term
    if (search) {
      result = result.filter(user => {
        return (
          (user.fullName?.toLowerCase().includes(search.toLowerCase())) ||
          (user.email?.toLowerCase().includes(search.toLowerCase())) ||
          (user.applicationId?.toLowerCase().includes(search.toLowerCase())) ||
          (user.staffId?.toLowerCase().includes(search.toLowerCase())) ||
          (user.adminId?.toLowerCase().includes(search.toLowerCase()))
        );
      });
    }
    
    setFilteredUsers(result);
  }, [search, users, activeRole]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setViewModalOpen(true);
  };

  // Register a user on the blockchain based on their role
  const handleRegisterOnBlockchain = async (user) => {
    let id, endpoint;
    
    if (user.role === 'student' && user.applicationId) {
      id = user.applicationId;
      endpoint = `/api/blockchain/students/register/${id}`;
    } else if (user.role === 'staff' && user.staffId) {
      id = user.staffId;
      endpoint = `/api/blockchain/staff/register/${id}`;
    } else if (user.role === 'admin' && user.adminId) {
      id = user.adminId;
      endpoint = `/api/blockchain/admin/register/${id}`;
    } else {
      toast.error(`Cannot register user: No ${user.role} ID found`);
      return;
    }
    
    try {
      setRefreshing(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error("Authentication token not found");
        setRefreshing(false);
        return;
      }
      
      // Call API to register user on blockchain
      const response = await axios.post(endpoint, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        toast.success(`${user.role.charAt(0).toUpperCase() + user.role.slice(1)} successfully registered on blockchain`);
        // Refresh user list to update status
        fetchAllUsers();
      } else {
        toast.error(response.data.message || "Failed to register on blockchain");
      }
    } catch (error) {
      console.error("Error registering on blockchain:", error);
      toast.error(error.response?.data?.message || "Failed to register on blockchain");
    } finally {
      setRefreshing(false);
    }
  };

  // Render blockchain status badge based on registration status
  const BlockchainStatusBadge = ({ user }) => {
    // Check for blockchain registration status
    const isRegistered = user.blockchainRegistrationStatus === 'success' || 
                         user.blockchainExists ||
                         !!user.blockchainTxHash;
    
    const isPending = user.blockchainRegistrationStatus === 'pending';
    const isFailed = user.blockchainRegistrationStatus === 'failed';
    
    if (isRegistered) {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs flex items-center">
          <FaCheck className="mr-1" /> Verified
        </span>
      );
    } else if (isPending) {
      return (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs flex items-center">
          <FaRegClock className="mr-1" /> Pending
        </span>
      );
    } else if (isFailed) {
      return (
        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs flex items-center">
          <FaTimesCircle className="mr-1" /> Failed
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs flex items-center">
          <FaEthereum className="mr-1" /> Not Registered
        </span>
      );
    }
  };

  // Define table columns
  const columns = [
    {
      name: "Name",
      selector: row => row.fullName || "N/A",
      sortable: true,
    },
    {
      name: "Email",
      selector: row => row.email || "N/A",
      sortable: true,
    },
    {
      name: "ID",
      selector: row => row.applicationId || row.staffId || row.adminId || "N/A",
      sortable: true,
    },
    {
      name: "Role",
      selector: row => row.role,
      sortable: true,
      cell: row => (
        <div className={`px-2 py-1 text-xs rounded-lg font-medium ${
          row.role === 'admin' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 
          row.role === 'staff' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 
          'bg-green-100 text-green-800 border border-green-200'
        }`}>
          {row.role}
        </div>
      ),
    },
    {
      name: "Status",
      selector: row => row.accountStatus || "Active",
      sortable: true,
      cell: row => (
        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
          row.accountStatus === 'Inactive' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
        }`}>
          {row.accountStatus || "Active"}
        </span>
      )
    },
    {
      name: "Blockchain Status",
      selector: row => row.blockchainRegistrationStatus,
      sortable: true,
      cell: row => <BlockchainStatusBadge user={row} />,
    },
    {
      name: "Actions",
      cell: row => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleViewDetails(row)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            View
          </button>
          
          {(!row.blockchainTxHash && row.blockchainRegistrationStatus !== 'success') && (
            <button
              onClick={() => handleRegisterOnBlockchain(row)}
              disabled={refreshing}
              className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center"
            >
              <FaEthereum className="mr-1" /> Register
            </button>
          )}
          
          
        </div>
      ),
    },
  ];

  // Bulk register students
  const handleBulkRegisterStudents = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error("Authentication token not found");
        setRefreshing(false);
        return;
      }
      
      // Call API to trigger bulk registration
      const response = await axios.post('/api/blockchain/jobs/register-unregistered', {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data) {
        toast.success(`Bulk student registration completed: ${response.data.success} succeeded, ${response.data.failure} failed`);
        // Refresh user list to update statuses
        fetchAllUsers();
      }
    } catch (error) {
      console.error("Error triggering bulk registration:", error);
      toast.error("Failed to trigger bulk registration");
    } finally {
      setRefreshing(false);
    }
  };

  // Bulk register staff
  const handleBulkRegisterStaff = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error("Authentication token not found");
        setRefreshing(false);
        return;
      }
      
      // Call API to trigger bulk staff registration
      const response = await axios.post('/api/blockchain/jobs/register-unregistered-staff', {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data) {
        toast.success(`Bulk staff registration completed: ${response.data.registered} succeeded, ${response.data.failed} failed`);
        // Refresh user list to update statuses
        fetchAllUsers();
      }
    } catch (error) {
      console.error("Error triggering staff registration:", error);
      toast.error("Failed to trigger staff registration");
    } finally {
      setRefreshing(false);
    }
  };

  // Bulk register admins
  const handleBulkRegisterAdmins = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error("Authentication token not found");
        setRefreshing(false);
        return;
      }
      
      // Call API to trigger bulk admin registration
      const response = await axios.post('/api/blockchain/jobs/register-unregistered-admins', {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data) {
        toast.success(`Bulk admin registration completed: ${response.data.registered} succeeded, ${response.data.failed} failed`);
        // Refresh user list to update statuses
        fetchAllUsers();
      }
    } catch (error) {
      console.error("Error triggering admin registration:", error);
      toast.error("Failed to trigger admin registration");
    } finally {
      setRefreshing(false);
    }
  };

  // Register all users (students, staff, admins)
  const handleRegisterAllUsers = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error("Authentication token not found");
        setRefreshing(false);
        return;
      }
      
      // Call API to trigger registration of all user types
      const response = await axios.post('/api/blockchain/jobs/register-all-users', {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.success) {
        toast.success(`All users registration completed: ${response.data.totals.success} succeeded, ${response.data.totals.failure} failed`);
        // Refresh user list to update statuses
        fetchAllUsers();
      } else {
        toast.error("Registration process completed with errors");
      }
    } catch (error) {
      console.error("Error triggering all users registration:", error);
      toast.error("Failed to trigger registration process");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="p-6">
      <Toaster position="top-right" />
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-[#0D0637]">User Management</h2>
        
        <div className="flex space-x-3">
          <div className="dropdown relative inline-block">
            <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 flex items-center text-sm">
              <FaEthereum className="mr-2" /> Bulk Register
            </button>
            <div className="dropdown-content hidden absolute right-0 mt-1 bg-white shadow-lg rounded-md z-10 w-56">
              <button 
                onClick={handleBulkRegisterStudents}
                disabled={refreshing}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center text-sm"
              >
                Register All Students
              </button>
              <button 
                onClick={handleBulkRegisterStaff}
                disabled={refreshing}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center text-sm"
              >
                Register All Staff
              </button>
              <button 
                onClick={handleBulkRegisterAdmins}
                disabled={refreshing}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center text-sm"
              >
                Register All Admins
              </button>
              <hr className="my-1" />
              <button 
                onClick={handleRegisterAllUsers}
                disabled={refreshing}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center text-sm font-semibold"
              >
                <FiUsers className="mr-2" /> Register All Users
              </button>
            </div>
          </div>
          
          <button
            onClick={() => setModalIsOpen(true)}
            className="bg-[#C3A135] text-white px-4 py-2 rounded hover:bg-[#a48625] flex items-center text-sm"
          >
            <FaUserPlus className="mr-2" /> Add User
          </button>
        </div>
      </div>
      
      {/* Blockchain Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-gray-500 text-sm font-medium">All Users</h4>
            <span className="bg-blue-100 text-blue-600 text-xs font-medium px-2 py-1 rounded-full">
              {Math.round((blockchainStats.registered / blockchainStats.total) * 100) || 0}%
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{blockchainStats.registered} / {blockchainStats.total}</p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{ width: `${(blockchainStats.registered / blockchainStats.total) * 100}%` }}
            ></div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-green-600 text-sm font-medium">Students</h4>
            <span className="bg-green-100 text-green-600 text-xs font-medium px-2 py-1 rounded-full">
              {Math.round((blockchainStats.students.registered / blockchainStats.students.total) * 100) || 0}%
            </span>
          </div>
          <p className="text-2xl font-bold text-green-600">{blockchainStats.students.registered} / {blockchainStats.students.total}</p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-green-500 h-2 rounded-full" 
              style={{ width: `${(blockchainStats.students.registered / blockchainStats.students.total) * 100}%` }}
            ></div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-blue-600 text-sm font-medium">Staff</h4>
            <span className="bg-blue-100 text-blue-600 text-xs font-medium px-2 py-1 rounded-full">
              {Math.round((blockchainStats.staff.registered / blockchainStats.staff.total) * 100) || 0}%
            </span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{blockchainStats.staff.registered} / {blockchainStats.staff.total}</p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-500 h-2 rounded-full" 
              style={{ width: `${(blockchainStats.staff.registered / blockchainStats.staff.total) * 100}%` }}
            ></div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-purple-600 text-sm font-medium">Admins</h4>
            <span className="bg-purple-100 text-purple-600 text-xs font-medium px-2 py-1 rounded-full">
              {Math.round((blockchainStats.admins.registered / blockchainStats.admins.total) * 100) || 0}%
            </span>
          </div>
          <p className="text-2xl font-bold text-purple-600">{blockchainStats.admins.registered} / {blockchainStats.admins.total}</p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-purple-500 h-2 rounded-full" 
              style={{ width: `${(blockchainStats.admins.registered / blockchainStats.admins.total) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        {/* Role Filter Tabs */}
        <div className="flex mb-4 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveRole("all")}
            className={`px-4 py-2 text-sm font-medium rounded ${
              activeRole === "all" ? "bg-white shadow-sm" : "text-gray-600 hover:bg-gray-200"
            }`}
          >
            All Users
          </button>
          <button
            onClick={() => setActiveRole("student")}
            className={`px-4 py-2 text-sm font-medium rounded ${
              activeRole === "student" ? "bg-white shadow-sm" : "text-gray-600 hover:bg-gray-200"
            }`}
          >
            Students
          </button>
          <button
            onClick={() => setActiveRole("staff")}
            className={`px-4 py-2 text-sm font-medium rounded ${
              activeRole === "staff" ? "bg-white shadow-sm" : "text-gray-600 hover:bg-gray-200"
            }`}
          >
            Staff
          </button>
          <button
            onClick={() => setActiveRole("admin")}
            className={`px-4 py-2 text-sm font-medium rounded ${
              activeRole === "admin" ? "bg-white shadow-sm" : "text-gray-600 hover:bg-gray-200"
            }`}
          >
            Admins
          </button>
        </div>
        
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name, email, or ID..."
              value={search}
              onChange={handleSearch}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
            />
          </div>
        </div>
        
        {/* User Data Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <DataTable
            columns={columns}
            data={filteredUsers}
            pagination
            progressPending={loading}
            progressComponent={
              <div className="py-6 flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0D0637]"></div>
              </div>
            }
            noDataComponent={
              <div className="p-4 text-center">
                <p className="text-gray-500">No users found</p>
              </div>
            }
            highlightOnHover
            pointerOnHover
          />
        </div>
        
        {/* Add User Modal */}
        <AddUserModal
          modalIsOpen={modalIsOpen}
          setModalIsOpen={setModalIsOpen}
          users={users}
          setUsers={setUsers}
        />
        
        {/* View User Details Modal */}
        <ViewDetailsModal
          isOpen={viewModalOpen}
          onClose={() => setViewModalOpen(false)}
          user={selectedUser}
        />
        
        {/* CSS for dropdown */}
        <style jsx>{`
          .dropdown:hover .dropdown-content {
            display: block;
          }
        `}</style>
      </div>
    );
  };
  
  export default UserList;