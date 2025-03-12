import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { FaUserPlus, FaEdit, FaTrash, FaSearch, FaEthereum, FaCheck, FaRegClock, FaTimesCircle } from "react-icons/fa";
import { FiExternalLink } from "react-icons/fi";
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

  // Fetch users data from backend
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error("Authentication token not found");
        setLoading(false);
        return;
      }
      
      // Fetch students with blockchain status data
      const response = await axios.get('/api/blockchain/students/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log("User data response:", response.data);
      
      // Extract users from response
      const userList = response.data.students || [];
      setUsers(userList);
      setFilteredUsers(userList);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle search filtering
  useEffect(() => {
    const result = users.filter(user => {
      return (
        (user.fullName?.toLowerCase().includes(search.toLowerCase())) ||
        (user.email?.toLowerCase().includes(search.toLowerCase())) ||
        (user.applicationId?.toLowerCase().includes(search.toLowerCase())) ||
        (user.staffId?.toLowerCase().includes(search.toLowerCase())) ||
        (user.adminId?.toLowerCase().includes(search.toLowerCase()))
      );
    });
    setFilteredUsers(result);
  }, [search, users]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setViewModalOpen(true);
  };

  const handleRegisterOnBlockchain = async (userId, applicationId) => {
    if (!applicationId) {
      toast.error("Application ID is required for blockchain registration");
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
      const response = await axios.post(`/api/blockchain/students/register/${applicationId}`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        toast.success("User successfully registered on blockchain");
        // Refresh user list to update status
        fetchUsers();
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
          
          {row.role === 'student' && !row.blockchainTxHash && row.blockchainRegistrationStatus !== 'success' && (
            <button
              onClick={() => handleRegisterOnBlockchain(row._id, row.applicationId)}
              disabled={refreshing}
              className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center"
            >
              <FaEthereum className="mr-1" /> Register
            </button>
          )}
          
          {row.blockchainTxHash && (
            <a 
              href={`https://etherscan.io/tx/${row.blockchainTxHash}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-800 text-sm flex items-center"
            >
              <FiExternalLink className="mr-1" /> View TX
            </a>
          )}
        </div>
      ),
    },
  ];

  // Bulk register action
  const handleBulkRegister = async () => {
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
        toast.success(`Bulk registration completed: ${response.data.success} succeeded, ${response.data.failure} failed`);
        // Refresh user list to update statuses
        fetchUsers();
      }
    } catch (error) {
      console.error("Error triggering bulk registration:", error);
      toast.error("Failed to trigger bulk registration");
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
          <button 
            onClick={handleBulkRegister}
            disabled={refreshing}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 flex items-center text-sm"
          >
            {refreshing ? "Processing..." : (
              <>
                <FaEthereum className="mr-2" /> Register All Unregistered
              </>
            )}
          </button>
          
          <button
            onClick={() => setModalIsOpen(true)}
            className="bg-[#C3A135] text-white px-4 py-2 rounded hover:bg-[#a48625] flex items-center text-sm"
          >
            <FaUserPlus className="mr-2" /> Add User
          </button>
        </div>
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
    </div>
  );
};

export default UserList;