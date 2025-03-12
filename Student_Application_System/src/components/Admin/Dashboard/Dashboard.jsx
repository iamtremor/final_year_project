import React, { useState, useEffect, useCallback } from "react";
import { FaUsers, FaEthereum, FaRegTimesCircle } from "react-icons/fa";
import { FiCheckCircle, FiRefreshCw, FiXCircle, FiClock } from "react-icons/fi";
import { IoMdNotificationsOutline } from "react-icons/io";
import { Link } from "react-router-dom";
import { IoIosArrowForward } from "react-icons/io";
import RecentActivity from "./RecentActivity";
import DataTable from "react-data-table-component";
import axios from "axios";

const AdminDashboard = () => {
  // State for blockchain registration section
  const [blockchainStats, setBlockchainStats] = useState({
    total: 0,
    registered: 0,
    pending: 0,
    failed: 0
  });
  const [recentBlockchainActivity, setRecentBlockchainActivity] = useState([]);
  const [loadingBlockchain, setLoadingBlockchain] = useState(true);
  const [refreshingBlockchain, setRefreshingBlockchain] = useState(false);
  const [blockchainError, setBlockchainError] = useState(null);

  // Create fetchBlockchainData as a useCallback to prevent recreation on each render
  const fetchBlockchainData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("No authentication token found");
      }
  
      const response = await axios.get('/api/blockchain/students/status', {
        headers: {
          'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`
        }
      });
  
      console.log('Full API Response:', response.data);
  
      // Extract stats from the response
      const stats = response.data.stats || {
        total: response.data.students?.length || 0,
        registered: response.data.students?.filter(s => 
          s.blockchainRegistrationStatus === 'success'
        ).length || 0,
        pending: response.data.students?.filter(s => 
          s.blockchainRegistrationStatus === 'pending'
        ).length || 0,
        failed: response.data.students?.filter(s => 
          s.blockchainRegistrationStatus === 'failed'
        ).length || 0
      };
  
      console.log('Extracted Stats:', stats);
      
      setBlockchainStats(stats);
  
      // Process recent blockchain activity
      const recentActivity = response.data.students
        ?.sort((a, b) => new Date(b.lastBlockchainRegistrationAttempt || b.createdAt) - 
                         new Date(a.lastBlockchainRegistrationAttempt || a.createdAt))
        .slice(0, 5) || [];
  
      setRecentBlockchainActivity(recentActivity);
  
    } catch (error) {
      console.error('Error fetching blockchain data:', error);
      setBlockchainError(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch blockchain data'
      );
    } finally {
      setLoadingBlockchain(false);
    }
  }, []); // No dependencies for useCallback // No dependencies for useCallback

  // Trigger the background job to register unregistered students
  const handleRegisterAllStudents = async () => {
    try {
      console.log("Triggering manual blockchain registration of all students");
      setRefreshingBlockchain(true);
      setBlockchainError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("No authentication token found");
      }
      
      // First, check blockchain connection
      try {
        const diagnoseResponse = await axios.get('/api/blockchain/diagnose', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log("Blockchain diagnostic results:", diagnoseResponse.data);
        
        if (!diagnoseResponse.data.connection?.isConnected) {
          alert("Warning: Blockchain connection is not established. Registration may fail.");
        }
      } catch (diagnoseError) {
        console.error("Error checking blockchain connection:", diagnoseError);
      }
      
      // Call the API to trigger registration
      const response = await axios.post('/api/blockchain/jobs/register-unregistered', {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log("Registration job response:", response.data);
      
      if (response.data) {
        const successCount = response.data.success || 0;
        const failureCount = response.data.failure || 0;
        
        let message = `Registration job completed: ${successCount} students registered`;
        if (failureCount > 0) {
          message += `, ${failureCount} failures`;
        }
        
        // Show feedback to user
        alert(message);
        
        // Refresh data after a short delay
        setTimeout(() => {
          fetchBlockchainData();
        }, 1000);
      }
    } catch (error) {
      console.error("Error triggering registration job:", error);
      
      setBlockchainError(
        error.response?.data?.message || 
        error.message || 
        "Failed to trigger registration job"
      );
      
      alert(`Failed to trigger registration: ${error.response?.data?.message || error.message}`);
    } finally {
      setRefreshingBlockchain(false);
    }
  };

  // Fetch data when component mounts
  useEffect(() => {
    console.log("Dashboard component mounted");
    fetchBlockchainData();
    
    // Optional: Set up periodic refresh
    const refreshInterval = setInterval(() => {
      console.log("Auto-refreshing blockchain data");
      fetchBlockchainData();
    }, 60000); // Refresh every minute
    
    // Clean up interval on unmount
    return () => clearInterval(refreshInterval);
  }, [fetchBlockchainData]); // Include fetchBlockchainData in dependencies

  // Define blockchain activity columns for the data table
  const blockchainActivityColumns = [
    {
      name: "Student Name",
      selector: (row) => row.fullName,
      sortable: true,
    },
    {
      name: "Application ID",
      selector: (row) => row.applicationId,
      sortable: true,
    },
    {
      name: "Status",
      selector: (row) => (
        <div className="flex items-center">
          {row.blockchainRegistrationStatus === 'success' ? (
            <span className="text-green-600 flex items-center bg-green-100 py-1 px-2 rounded">
              <FiCheckCircle className="mr-1" /> Registered
            </span>
          ) : row.blockchainRegistrationStatus === 'pending' ? (
            <span className="text-yellow-600 flex items-center bg-yellow-100 py-1 px-2 rounded">
              <FiClock className="mr-1" /> Pending
            </span>
          ) : (
            <span className="text-red-600 flex items-center bg-red-100 py-1 px-2 rounded">
              <FiXCircle className="mr-1" /> Failed
            </span>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      name: "Transaction Hash",
      selector: (row) => (
        <div className="max-w-xs truncate">
          {row.blockchainTxHash ? (
            <a 
              href={`https://etherscan.io/tx/${row.blockchainTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline truncate"
              title={row.blockchainTxHash}
            >
              {row.blockchainTxHash.slice(0, 10)}...{row.blockchainTxHash.slice(-8)}
            </a>
          ) : (
            <span className="text-gray-400">N/A</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <h2 className="text-xl font-bold text-[#0D0637] mb-6 font-textFont2">
        Admin Dashboard
      </h2>

      {/* Quick Summary Cards */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6 text-white">
        <div className="bg-[#1E3A8A] shadow-lg rounded-lg p-12 flex items-center">
          <FaUsers size={30} className="text-[#C3A135] mr-4" />
          <div>
            <h3 className="text-sm font-bold">Total Users</h3>
            <p className="text-gray-300 ">{blockchainStats.total}</p>
            <div className="flex items-center mt-3">
              <Link
                to="/admin/manage-user-user-list"
                className="block text-sm underline"
              >
                Total Users
              </Link>
              <IoIosArrowForward />
            </div>
          </div>
        </div>

        <div className="bg-[#1E3A8A] shadow-lg rounded-lg p-12 flex items-center">
          <FaRegTimesCircle size={30} className="text-[#C3A135] mr-4" />
          <div>
            <h3 className="text-sm font-bold text-white">Rejected Documents</h3>
            <p className="text-gray-300 ">23 Documents</p>
            <div className="flex items-center mt-3 ">
              <Link
                to="/admin/my-documents/rejected"
                className="block text-sm underline"
              >
                Rejected Documents
              </Link>
              <IoIosArrowForward cl />
            </div>
          </div>
        </div>
        <div className="bg-[#1E3A8A] shadow-lg rounded-lg p-12 flex items-center">
          <FiCheckCircle size={30} className="text-[#C3A135] mr-4" />
          <div>
            <h3 className="text-sm font-bold text-white">Approved Documents</h3>
            <p className="text-gray-300">178 Files</p>
            <div className="flex items-center mt-3 ">
              <Link
                to="/admin/my-documents/approved"
                className="block text-sm underline"
              >
                Approved Documents
              </Link>
              <IoIosArrowForward cl />
            </div>
          </div>
        </div>
        <div className="bg-[#1E3A8A] shadow-lg rounded-lg p-12 flex items-center">
          <IoMdNotificationsOutline size={30} className="text-[#C3A135] mr-4" />
          <div>
            <h3 className="text-sm font-bold text-white">
              System Notifications
            </h3>
            <p className="text-gray-300">5 New Alerts</p>
            <div className="flex items-center mt-3 ">
              <Link
                to="/admin/notifications"
                className="block text-sm underline"
              >
                Notifications
              </Link>
              <IoIosArrowForward cl />
            </div>
          </div>
        </div>
      </div>

      {/* Blockchain Registration Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-[#0D0637] flex items-center">
            <FaEthereum className="mr-2" />
            Blockchain Registration Status
          </h3>
          
          <div className="flex items-center">
            <button
              onClick={handleRegisterAllStudents}
              className="bg-[#C3A135] text-white px-4 py-2 rounded-md flex items-center mr-2"
              disabled={refreshingBlockchain || loadingBlockchain}
            >
              {refreshingBlockchain ? (
                <>
                  <FiRefreshCw className="mr-2 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <FiRefreshCw className="mr-2" /> Register All
                </>
              )}
            </button>
            
            <Link
              to="/admin/blockchain-dashboard"
              className="text-[#0D0637] hover:underline flex items-center"
            >
              View Full Dashboard
              <IoIosArrowForward className="ml-1" />
            </Link>
          </div>
        </div>
        
        {/* Error Message */}
        {blockchainError && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
            <p className="flex items-center">
              <FiXCircle className="mr-2" /> 
              Error: {blockchainError}
            </p>
            <p className="text-sm mt-1">
              Try refreshing the page or check server logs for more information.
            </p>
          </div>
        )}
        
        {/* Loading State */}
        {loadingBlockchain && (
          <div className="bg-blue-50 text-blue-700 p-3 rounded-md mb-4">
            <p className="flex items-center">
              <FiRefreshCw className="mr-2 animate-spin" /> 
              Loading blockchain registration data...
            </p>
          </div>
        )}
        
        {/* Status Messages */}
        {!loadingBlockchain && !blockchainError && (
          <>
            {blockchainStats.total === 0 ? (
              <div className="bg-yellow-50 text-yellow-700 p-3 rounded-md mb-4">
                <p>No student records found. Please add students to register them on the blockchain.</p>
              </div>
            ) : blockchainStats.registered === 0 && blockchainStats.pending > 0 ? (
              <div className="bg-yellow-50 text-yellow-700 p-3 rounded-md mb-4">
                <p className="flex items-center mb-2">
                  <FiClock className="mr-2" /> 
                  All students are pending blockchain registration.
                </p>
                <p className="text-sm">
                  Click "Register All" to process them. This may take a few moments.
                </p>
              </div>
            ) : null}
          </>
        )}
        
        {/* Blockchain Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-white shadow-sm rounded-lg p-4 border-l-4 border-[#1E3A8A]">
            <h4 className="text-gray-500 text-sm">Total Students</h4>
            <p className="text-2xl font-semibold">{blockchainStats.total}</p>
          </div>
          <div className="bg-white shadow-sm rounded-lg p-4 border-l-4 border-green-500">
            <h4 className="text-green-600 text-sm">Registered</h4>
            <p className="text-2xl font-semibold text-green-600">
              {blockchainStats.registered}
            </p>
          </div>
          <div className="bg-white shadow-sm rounded-lg p-4 border-l-4 border-yellow-500">
            <h4 className="text-yellow-600 text-sm">Pending</h4>
            <p className="text-2xl font-semibold text-yellow-600">{blockchainStats.pending}</p>
          </div>
          <div className="bg-white shadow-sm rounded-lg p-4 border-l-4 border-red-500">
            <h4 className="text-red-600 text-sm">Failed</h4>
            <p className="text-2xl font-semibold text-red-600">{blockchainStats.failed}</p>
          </div>
        </div>
        
        {/* Recent Blockchain Activity */}
        <div className="bg-white shadow-lg rounded-lg p-4">
          <h4 className="font-medium mb-2">Recent Blockchain Activity</h4>
          {loadingBlockchain ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E3A8A] mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading blockchain data...</p>
            </div>
          ) : blockchainError ? (
            <div className="text-center py-4">
              <p className="text-red-500">Error loading blockchain activity</p>
            </div>
          ) : recentBlockchainActivity.length > 0 ? (
            <DataTable
              columns={blockchainActivityColumns}
              data={recentBlockchainActivity}
              highlightOnHover
              responsive
              noHeader
              fixedHeader
              fixedHeaderScrollHeight="300px"
              dense
            />
          ) : (
            <p className="text-center py-4 text-gray-500">No blockchain registration activity found</p>
          )}
        </div>
      </div>

      {/* Recent Activity Table */}
      <h3 className="text-xl font-bold text-[#0D0637] mb-4">Recent Activity</h3>
      <RecentActivity />
      
      {/* Notifications Panel */}
      <h3 className="text-xl font-bold text-[#0D0637] mt-6 mb-4">
        System Notifications
      </h3>
      <div className="bg-white shadow-lg rounded-lg p-4">
        <p className="text-gray-600">
          🚀 Enrollment deadline extended - Jan 5, 2025
        </p>
        <p className="text-gray-600">
          ⚠️ Document submission required - Jan 4, 2025
        </p>
      </div>
    </div>
  );
};

export default AdminDashboard;