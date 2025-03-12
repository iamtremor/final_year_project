import React from "react";
import Modal from "react-modal";
import { FaCheck, FaRegClock, FaTimesCircle, FaEthereum, FaCalendarAlt } from "react-icons/fa";
import { format } from "date-fns";

Modal.setAppElement("#root"); // For accessibility

const ViewDetails = ({ isOpen, onClose, user }) => {
  if (!user) return null;

  // Format date helper function
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch (error) {
      return dateString;
    }
  };

  // Get blockchain status info
  const getBlockchainStatus = () => {
    // Check for blockchain registration status
    const isRegistered = user.blockchainRegistrationStatus === 'success' || 
                         user.blockchainExists ||
                         !!user.blockchainTxHash;
    
    const isPending = user.blockchainRegistrationStatus === 'pending';
    const isFailed = user.blockchainRegistrationStatus === 'failed';
    
    if (isRegistered) {
      return {
        status: "Verified",
        icon: <FaCheck className="text-green-500" />,
        color: "text-green-600",
        bg: "bg-green-100",
        border: "border-green-300"
      };
    } else if (isPending) {
      return {
        status: "Pending",
        icon: <FaRegClock className="text-yellow-500" />,
        color: "text-yellow-600",
        bg: "bg-yellow-100",
        border: "border-yellow-300"
      };
    } else if (isFailed) {
      return {
        status: "Failed",
        icon: <FaTimesCircle className="text-red-500" />,
        color: "text-red-600",
        bg: "bg-red-100",
        border: "border-red-300"
      };
    } else {
      return {
        status: "Not Registered",
        icon: <FaEthereum className="text-gray-500" />,
        color: "text-gray-600",
        bg: "bg-gray-100",
        border: "border-gray-300"
      };
    }
  };

  const blockchainStatus = getBlockchainStatus();

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="User Details"
      className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto mt-20"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center z-50"
    >
      <div className="space-y-6">
        {/* Header with user info */}
        <div className="bg-gray-50 p-6 rounded-lg border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-[#0D0637]">{user.fullName}</h2>
              <p className="text-gray-500 mt-1">{user.email}</p>
            </div>
            <div className="ml-4">
              <div className={`px-4 py-2 text-sm font-medium rounded-md ${
                user.role === 'admin' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 
                user.role === 'staff' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 
                'bg-green-100 text-green-800 border border-green-200'
              }`}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </div>
            </div>
          </div>
        </div>

        {/* Main content with user details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-2">
          {/* Left column */}
          <div className="space-y-5">
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-[#0D0637]">Basic Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">User ID</label>
                  <div className="font-medium text-lg">
                    {user.applicationId || user.staffId || user.adminId || "N/A"}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Account Status</label>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    user.accountStatus === 'Inactive' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {user.accountStatus || "Active"}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Created On</label>
                  <div className="font-medium flex items-center">
                    <FaCalendarAlt className="mr-2 text-gray-400" />
                    {formatDate(user.createdAt)}
                  </div>
                </div>
                
                {user.phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
                    <div className="font-medium">{user.phone}</div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Additional info section */}
            {user.department && (
              <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold mb-4 text-[#0D0637]">Additional Details</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Department</label>
                  <div className="font-medium">{user.department}</div>
                </div>
              </div>
            )}
          </div>
          
          {/* Right column - Blockchain information */}
          {user.role === 'student' && (
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-[#0D0637]">Blockchain Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Registration Status</label>
                  <div className="flex items-center">
                    <span className={`px-3 py-1 rounded-md text-sm font-medium flex items-center ${blockchainStatus.bg} ${blockchainStatus.color}`}>
                      {blockchainStatus.icon}
                      <span className="ml-2">{blockchainStatus.status}</span>
                    </span>
                  </div>
                </div>
                
                {user.blockchainTxHash && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Transaction Hash</label>
                    <div className="bg-gray-50 p-3 rounded border border-gray-200 font-mono text-sm break-all">
                      {user.blockchainTxHash}
                    </div>
                    {/* Link to blockchain explorer */}
                    <a 
                      href={`https://etherscan.io/tx/${user.blockchainTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center mt-2"
                    >
                      <FaEthereum className="mr-1" /> View on Blockchain Explorer
                    </a>
                  </div>
                )}
                
                {user.blockchainBlockNumber && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Block Number</label>
                    <div className="font-medium">{user.blockchainBlockNumber}</div>
                  </div>
                )}
                
                {user.blockchainRegistrationAttempts > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Registration Attempts</label>
                    <div className="font-medium">{user.blockchainRegistrationAttempts}</div>
                  </div>
                )}
                
                {user.lastBlockchainRegistrationAttempt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Last Attempt</label>
                    <div className="font-medium">{formatDate(user.lastBlockchainRegistrationAttempt)}</div>
                  </div>
                )}
                
                {(user.blockchainRegistrationStatus === 'failed') && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 mt-4">
                    <div className="flex">
                      <FaTimesCircle className="flex-shrink-0 h-5 w-5 text-red-500 mt-0.5" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Registration Failed</h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>The last attempt to register this student on the blockchain failed.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md text-sm font-medium hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ViewDetails;