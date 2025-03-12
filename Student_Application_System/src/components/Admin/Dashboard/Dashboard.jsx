import React, { useState, useEffect } from "react";
import { FaUsers } from "react-icons/fa";
import { AiOutlineClockCircle, AiOutlineBarChart } from "react-icons/ai";
import { HiOutlineDocumentSearch } from "react-icons/hi";
import { IoMdNotificationsOutline } from "react-icons/io";
import { Link } from "react-router-dom";
import { IoIosArrowForward } from "react-icons/io";
import { FaHourglassHalf, FaRegTimesCircle, FaEthereum } from "react-icons/fa";
import { FiCheckCircle, FiRefreshCw, FiXCircle, FiClock } from "react-icons/fi";
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

  // Fetch blockchain registration data
  const fetchBlockchainData = async () => {
    try {
      setLoadingBlockchain(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/blockchain/students/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data) {
        // Update stats
        setBlockchainStats(response.data.stats || {
          total: 0,
          registered: 0,
          pending: 0,
          failed: 0
        });
        
        // Set recent activity (latest 5 students)
        if (Array.isArray(response.data.students)) {
          // Sort by last attempt date or creation date, newest first
          const sortedStudents = response.data.students.sort((a, b) => {
            const dateA = a.lastBlockchainRegistrationAttempt || a.createdAt;
            const dateB = b.lastBlockchainRegistrationAttempt || b.createdAt;
            return new Date(dateB) - new Date(dateA);
          });
          
          // Take the first 5
          setRecentBlockchainActivity(sortedStudents.slice(0, 5));
        }
      }
    } catch (error) {
      console.error("Error fetching blockchain data:", error);
    } finally {
      setLoadingBlockchain(false);
    }
  };

  // Trigger the background job to register unregistered students
  const handleRegisterAllStudents = async () => {
    try {
      setRefreshingBlockchain(true);
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/blockchain/jobs/register-unregistered', {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        alert(`Job completed: ${response.data.success} students registered, ${response.data.failure} failures`);
        fetchBlockchainData();
      }
    } catch (error) {
      console.error("Error triggering registration job:", error);
      alert(`Failed to trigger registration job: ${error.response?.data?.message || error.message}`);
    } finally {
      setRefreshingBlockchain(false);
    }
  };

  // Fetch data when component mounts
  useEffect(() => {
    fetchBlockchainData();
  }, []);

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
            <span className="text-green-600 flex items-center">
              <FiCheckCircle className="mr-1" /> Registered
            </span>
          ) : row.blockchainRegistrationStatus === 'pending' ? (
            <span className="text-yellow-600 flex items-center">
              <FiClock className="mr-1" /> Pending
            </span>
          ) : (
            <span className="text-red-600 flex items-center">
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
            <p className="text-gray-300 ">1,250</p>
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
              disabled={refreshingBlockchain}
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
        
        {/* Blockchain Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-white shadow-sm rounded-lg p-4 border-l-4 border-[#1E3A8A]">
            <h4 className="text-gray-500 text-sm">Total Students</h4>
            <p className="text-2xl font-semibold">{blockchainStats.total}</p>
          </div>
          <div className="bg-white shadow-sm rounded-lg p-4 border-l-4 border-green-500">
            <h4 className="text-green-600 text-sm">Registered</h4>
            <p className="text-2xl font-semibold text-green-600">{blockchainStats.registered}</p>
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