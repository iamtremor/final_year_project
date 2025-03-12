import React, { useState, useEffect, useCallback } from "react";
import { 
  FaUsers, 
  FaEthereum, 
  FaRegTimesCircle, 
  FaClipboardCheck, 
  FaBell,
  FaChevronRight,
  FaRegClock
} from "react-icons/fa";
import { FiCheckCircle, FiRefreshCw, FiXCircle, FiClock, FiAlertTriangle } from "react-icons/fi";
import { Link } from "react-router-dom";
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
  }, []);

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
  }, [fetchBlockchainData]);

  // Sample recent activity data (replace with actual API data)
  const recentActivityData = [
    {
      id: 1,
      action: "Document Approved",
      user: "John Smith",
      timestamp: "Today, 10:30 AM",
      details: "Transcript approved"
    },
    {
      id: 2,
      action: "User Registered",
      user: "Sarah Johnson",
      timestamp: "Yesterday, 3:45 PM",
      details: "New student registration"
    },
    {
      id: 3,
      action: "Document Rejected",
      user: "Michael Brown",
      timestamp: "Mar 10, 2025",
      details: "ID verification failed"
    }
  ];

  // Sample notification data
  const notifications = [
    {
      id: 1,
      type: "deadline",
      message: "Enrollment deadline extended",
      date: "Jan 5, 2025",
      priority: "high"
    },
    {
      id: 2,
      type: "document",
      message: "Document submission required",
      date: "Jan 4, 2025",
      priority: "medium"
    },
    {
      id: 3,
      type: "system",
      message: "System maintenance scheduled",
      date: "Jan 10, 2025",
      priority: "low"
    },
    {
      id: 4,
      type: "alert",
      message: "New policy update available",
      date: "Jan 2, 2025",
      priority: "medium"
    }
  ];

  // Define blockchain activity columns for the data table
  const blockchainActivityColumns = [
    {
      name: "Student Name",
      selector: row => row.fullName,
      sortable: true,
      cell: row => (
        <div className="py-2 font-medium">{row.fullName}</div>
      )
    },
    {
      name: "Application ID",
      selector: row => row.applicationId,
      sortable: true,
      cell: row => (
        <div className="py-2 font-mono text-sm">{row.applicationId}</div>
      )
    },
    {
      name: "Status",
      selector: row => row.blockchainRegistrationStatus,
      sortable: true,
      cell: row => (
        <div className="py-2">
          {row.blockchainRegistrationStatus === 'success' ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <FiCheckCircle className="mr-1" /> Registered
            </span>
          ) : row.blockchainRegistrationStatus === 'pending' ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              <FiClock className="mr-1" /> Pending
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              <FiXCircle className="mr-1" /> Failed
            </span>
          )}
        </div>
      )
    },
    {
      name: "Transaction Hash",
      selector: row => row.blockchainTxHash,
      cell: row => (
        <div className="py-2">
          {row.blockchainTxHash ? (
            <a 
              href={`https://etherscan.io/tx/${row.blockchainTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-mono text-sm"
              title={row.blockchainTxHash}
            >
              {row.blockchainTxHash.slice(0, 8)}...{row.blockchainTxHash.slice(-6)}
            </a>
          ) : (
            <span className="text-gray-400">N/A</span>
          )}
        </div>
      )
    }
  ];

  // Define recent activity columns
  const activityColumns = [
    {
      name: "Action",
      selector: row => row.action,
      sortable: true,
      cell: row => (
        <div className={`py-2 font-medium ${
          row.action.includes("Approved") 
            ? "text-green-700" 
            : row.action.includes("Rejected") 
              ? "text-red-700" 
              : "text-blue-700"
        }`}>
          {row.action}
        </div>
      )
    },
    {
      name: "User",
      selector: row => row.user,
      sortable: true
    },
    {
      name: "Time",
      selector: row => row.timestamp,
      sortable: true,
      cell: row => (
        <div className="text-gray-500 text-sm">{row.timestamp}</div>
      )
    },
    {
      name: "Details",
      selector: row => row.details,
      cell: row => (
        <div className="text-gray-700">{row.details}</div>
      )
    }
  ];

  // Custom styles for DataTable
  const customStyles = {
    headCells: {
      style: {
        fontSize: '0.875rem',
        fontWeight: '600',
        color: '#1E3A8A',
        backgroundColor: '#F9FAFB',
        paddingLeft: '16px',
        paddingRight: '16px',
      },
    },
    rows: {
      style: {
        fontSize: '0.875rem',
        minHeight: '48px',
        '&:not(:last-of-type)': {
          borderBottomStyle: 'solid',
          borderBottomWidth: '1px',
          borderBottomColor: '#F3F4F6',
        },
      },
      highlightOnHoverStyle: {
        backgroundColor: '#F9FAFB',
        borderBottomColor: '#F3F4F6',
        outline: '1px solid #F3F4F6',
        borderRadius: '4px',
      },
    },
    pagination: {
      style: {
        color: '#1E3A8A',
        fontSize: '0.875rem',
        minHeight: '56px',
        backgroundColor: '#FFFFFF',
        borderTopStyle: 'solid',
        borderTopWidth: '1px',
        borderTopColor: '#F3F4F6',
      },
      pageButtonsStyle: {
        borderRadius: '50%',
        height: '32px',
        width: '32px',
        padding: '8px',
        margin: '0px 4px',
        cursor: 'pointer',
        transition: '0.4s',
        color: '#1E3A8A',
        fill: '#1E3A8A',
        backgroundColor: 'transparent',
        '&:disabled': {
          cursor: 'unset',
          color: '#9CA3AF',
          fill: '#9CA3AF',
        },
        '&:hover:not(:disabled)': {
          backgroundColor: '#F3F4F6',
        },
        '&:focus': {
          outline: 'none',
          backgroundColor: '#F3F4F6',
        },
      },
    },
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome to your enrollment system control center</p>
      </div>

      {/* Quick Summary Cards */}
      <section className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Users Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="rounded-full bg-blue-100 p-3">
                  <FaUsers className="text-blue-700 text-xl" />
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                  Users
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
                <p className="text-2xl font-semibold mt-1 text-gray-900">{blockchainStats.total}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link to="/admin/manage-user-user-list" className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
                  View all users
                  <FaChevronRight className="ml-1 text-xs" />
                </Link>
              </div>
            </div>
          </div>

          {/* Rejected Documents Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="rounded-full bg-red-100 p-3">
                  <FaRegTimesCircle className="text-red-700 text-xl" />
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-700">
                  Documents
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-500">Rejected Documents</h3>
                <p className="text-2xl font-semibold mt-1 text-gray-900">23</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link to="/admin/my-documents/rejected" className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center">
                  View rejected documents
                  <FaChevronRight className="ml-1 text-xs" />
                </Link>
              </div>
            </div>
          </div>

          {/* Approved Documents Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="rounded-full bg-green-100 p-3">
                  <FaClipboardCheck className="text-green-700 text-xl" />
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
                  Documents
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-500">Approved Documents</h3>
                <p className="text-2xl font-semibold mt-1 text-gray-900">178</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link to="/admin/my-documents/approved" className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center">
                  View approved documents
                  <FaChevronRight className="ml-1 text-xs" />
                </Link>
              </div>
            </div>
          </div>

          {/* Notifications Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="rounded-full bg-purple-100 p-3">
                  <FaBell className="text-purple-700 text-xl" />
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                  Alerts
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-500">System Notifications</h3>
                <p className="text-2xl font-semibold mt-1 text-gray-900">5</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link to="/admin/notifications" className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center">
                  View notifications
                  <FaChevronRight className="ml-1 text-xs" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blockchain Registration Section */}
      <section className="mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center">
                <FaEthereum className="mr-2 text-blue-600" />
                Blockchain Registration Status
              </h2>
              
              <div className="flex items-center mt-3 md:mt-0">
                <button
                  onClick={handleRegisterAllStudents}
                  className="bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-300 focus:outline-none text-white px-4 py-2 rounded-md flex items-center mr-3 transition duration-300 ease-in-out"
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
                  className="text-blue-600 hover:text-blue-800 font-medium flex items-center transition duration-300"
                >
                  View Full Dashboard
                  <FaChevronRight className="ml-1 text-xs" />
                </Link>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {/* Error Message */}
            {blockchainError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
                <p className="flex items-center font-medium">
                  <FiXCircle className="mr-2 flex-shrink-0" /> 
                  Error: {blockchainError}
                </p>
                <p className="text-sm mt-2 ml-6">
                  Try refreshing the page or check server logs for more information.
                </p>
              </div>
            )}
            
            {/* Loading State */}
            {loadingBlockchain && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-md mb-6">
                <p className="flex items-center">
                  <FiRefreshCw className="mr-2 animate-spin flex-shrink-0" /> 
                  Loading blockchain registration data...
                </p>
              </div>
            )}
            
            {/* Status Messages */}
            {!loadingBlockchain && !blockchainError && (
              <>
                {blockchainStats.total === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-md mb-6">
                    <p className="flex items-center">
                      <FiAlertTriangle className="mr-2 flex-shrink-0" />
                      No student records found. Please add students to register them on the blockchain.
                    </p>
                  </div>
                ) : blockchainStats.registered === 0 && blockchainStats.pending > 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-md mb-6">
                    <p className="flex items-center font-medium">
                      <FiClock className="mr-2 flex-shrink-0" /> 
                      All students are pending blockchain registration.
                    </p>
                    <p className="text-sm mt-2 ml-6">
                      Click "Register All" to process them. This may take a few moments.
                    </p>
                  </div>
                ) : null}
              </>
            )}
            
            {/* Blockchain Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-gray-500 text-sm font-medium">Total Students</h4>
                  <span className="bg-blue-100 text-blue-600 text-xs font-medium px-2 py-1 rounded-full">
                    {Math.round((blockchainStats.total / blockchainStats.total) * 100) || 0}%
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{blockchainStats.total}</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: '100%' }}
                  ></div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-green-600 text-sm font-medium">Registered</h4>
                  <span className="bg-green-100 text-green-600 text-xs font-medium px-2 py-1 rounded-full">
                    {Math.round((blockchainStats.registered / blockchainStats.total) * 100) || 0}%
                  </span>
                </div>
                <p className="text-2xl font-bold text-green-600">{blockchainStats.registered}</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${(blockchainStats.registered / blockchainStats.total) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-yellow-600 text-sm font-medium">Pending</h4>
                  <span className="bg-yellow-100 text-yellow-600 text-xs font-medium px-2 py-1 rounded-full">
                    {Math.round((blockchainStats.pending / blockchainStats.total) * 100) || 0}%
                  </span>
                </div>
                <p className="text-2xl font-bold text-yellow-600">{blockchainStats.pending}</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full" 
                    style={{ width: `${(blockchainStats.pending / blockchainStats.total) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-red-600 text-sm font-medium">Failed</h4>
                  <span className="bg-red-100 text-red-600 text-xs font-medium px-2 py-1 rounded-full">
                    {Math.round((blockchainStats.failed / blockchainStats.total) * 100) || 0}%
                  </span>
                </div>
                <p className="text-2xl font-bold text-red-600">{blockchainStats.failed}</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${(blockchainStats.failed / blockchainStats.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            {/* Recent Blockchain Activity */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Recent Blockchain Activity</h3>
              {loadingBlockchain ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-3 text-gray-500">Loading blockchain data...</p>
                </div>
              ) : blockchainError ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <FiXCircle className="h-10 w-10 text-red-500 mx-auto" />
                  <p className="mt-3 text-red-500 font-medium">Error loading blockchain activity</p>
                  <p className="text-gray-500 text-sm mt-1">Please try again later</p>
                </div>
              ) : recentBlockchainActivity.length > 0 ? (
                <DataTable
                  columns={blockchainActivityColumns}
                  data={recentBlockchainActivity}
                  customStyles={customStyles}
                  highlightOnHover
                  responsive
                  pagination
                  paginationPerPage={5}
                  paginationRowsPerPageOptions={[5, 10, 15]}
                  noHeader
                  className="rounded-lg overflow-hidden"
                />
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <FaRegClock className="h-10 w-10 text-gray-400 mx-auto" />
                  <p className="mt-3 text-gray-500">No blockchain registration activity found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Recent Activity & Notifications Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity Table */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
            </div>
            <div className="p-6">
              <DataTable
                columns={activityColumns}
                data={recentActivityData}
                customStyles={customStyles}
                highlightOnHover
                responsive
                pagination
                paginationPerPage={5}
                paginationRowsPerPageOptions={[5, 10, 15]}
                noHeader
                className="rounded-lg overflow-hidden"
              />
            </div>
          </div>
        </div>
        
        {/* Notifications Panel */}
        <div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
                              <h2 className="text-lg font-bold text-gray-900 flex items-center">
                <FaBell className="mr-2 text-purple-600" />
                System Notifications
              </h2>
            </div>
            <div className="p-6">
              {notifications.length > 0 ? (
                <div className="space-y-4">
                  {notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className="p-4 rounded-lg border border-gray-100 hover:shadow-sm transition duration-300"
                    >
                      <div className="flex items-start">
                        {/* Icon based on notification type */}
                        <div className={`flex-shrink-0 rounded-full p-2 mr-3 ${
                          notification.priority === 'high' 
                            ? 'bg-red-100' 
                            : notification.priority === 'medium'
                              ? 'bg-yellow-100'
                              : 'bg-green-100'
                        }`}>
                          {notification.type === 'deadline' && (
                            <FaRegClock className={`${
                              notification.priority === 'high' 
                                ? 'text-red-600' 
                                : notification.priority === 'medium'
                                  ? 'text-yellow-600'
                                  : 'text-green-600'
                            }`} />
                          )}
                          {notification.type === 'document' && (
                            <FaClipboardCheck className={`${
                              notification.priority === 'high' 
                                ? 'text-red-600' 
                                : notification.priority === 'medium'
                                  ? 'text-yellow-600'
                                  : 'text-green-600'
                            }`} />
                          )}
                          {notification.type === 'system' && (
                            <FaEthereum className={`${
                              notification.priority === 'high' 
                                ? 'text-red-600' 
                                : notification.priority === 'medium'
                                  ? 'text-yellow-600'
                                  : 'text-green-600'
                            }`} />
                          )}
                          {notification.type === 'alert' && (
                            <FiAlertTriangle className={`${
                              notification.priority === 'high' 
                                ? 'text-red-600' 
                                : notification.priority === 'medium'
                                  ? 'text-yellow-600'
                                  : 'text-green-600'
                            }`} />
                          )}
                        </div>
                        
                        <div>
                          <p className="font-medium text-gray-900">{notification.message}</p>
                          <p className="text-sm text-gray-500 mt-1">{notification.date}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <FaBell className="h-10 w-10 text-gray-400 mx-auto" />
                  <p className="mt-3 text-gray-500">No notifications available</p>
                </div>
              )}
              
              <div className="mt-6 pt-4 border-t border-gray-100">
                <Link to="/admin/notifications" className="text-purple-600 hover:text-purple-800 font-medium flex items-center justify-center">
                  View all notifications
                  <FaChevronRight className="ml-1 text-xs" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;