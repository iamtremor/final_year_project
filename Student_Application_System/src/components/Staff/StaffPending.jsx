import React, { useState, useEffect, useCallback } from "react";
import { 
  FaUsers, 
  FaClipboardCheck, 
  FaRegTimesCircle, 
  FaBell,
  FaChevronRight,
  FaClipboardList,
  FaFileAlt,
  FaEye,
  FaCheck,
  FaTimes,
  FaSearch
} from "react-icons/fa";
import { 
  FiCheckCircle, 
  FiClock, 
  FiXCircle, 
  FiAlertTriangle,
  FiRefreshCw
} from "react-icons/fi";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";

const StaffPending = () => {
  const { user } = useAuth();
  const [pendingItems, setPendingItems] = useState({
    forms: [],
    documents: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch data with useCallback to prevent unnecessary re-renders
  const fetchPendingItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [formsResponse, documentsResponse] = await Promise.all([
        api.get('/clearance/forms/pending?formType=newClearance'),
        api.get('/documents/staff/approvable')
      ]);
      
      let processedForms = [];
      if (formsResponse.data) {
        if (Array.isArray(formsResponse.data)) {
          processedForms = formsResponse.data;
        } else {
          Object.keys(formsResponse.data).forEach(formType => {
            const forms = formsResponse.data[formType];
            if (Array.isArray(forms)) {
              processedForms = [
                ...processedForms,
                ...forms.map(form => ({
                  ...form,
                  type: formType
                }))
              ];
            }
          });
        }
      }
      
      setPendingItems({
        forms: processedForms || [],
        documents: documentsResponse.data || []
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching pending items:', error);
      setError('Failed to load pending items. Please try again later.');
      setLoading(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchPendingItems();
  }, [fetchPendingItems]);

  // Refresh data handler
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPendingItems();
    setRefreshing(false);
  };

  // Filtering methods
  const filterByDate = (items) => {
    if (selectedFilter === 'all') return items;
    
    const now = new Date();
    let cutoffDate;
    
    switch (selectedFilter) {
      case 'today':
        cutoffDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        cutoffDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        cutoffDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      default:
        return items;
    }
    
    return items.filter(item => {
      const itemDate = new Date(item.submittedDate || item.createdAt);
      return itemDate >= cutoffDate;
    });
  };

  const getFilteredItems = () => {
    const filteredByDate = {
      forms: filterByDate(pendingItems.forms),
      documents: filterByDate(pendingItems.documents)
    };
    
    if (!searchTerm) {
      return filteredByDate;
    }
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return {
      forms: filteredByDate.forms.filter(form => 
        (form.studentId?.fullName || '').toLowerCase().includes(lowerSearchTerm) ||
        (form.studentName || '').toLowerCase().includes(lowerSearchTerm) ||
        (form.type || '').toLowerCase().includes(lowerSearchTerm)
      ),
      documents: filteredByDate.documents.filter(doc => 
        (doc.owner?.fullName || '').toLowerCase().includes(lowerSearchTerm) ||
        (doc.documentType || '').toLowerCase().includes(lowerSearchTerm)
      )
    };
  };

  const getVisibleItems = () => {
    const filteredItems = getFilteredItems();
    
    if (activeTab === 'forms') {
      return filteredItems.forms;
    } else if (activeTab === 'documents') {
      return filteredItems.documents;
    } else {
      return [
        ...filteredItems.forms.map(form => ({ ...form, itemType: 'form' })),
        ...filteredItems.documents.map(doc => ({ ...doc, itemType: 'document' }))
      ];
    }
  };

  // Formatting helpers
  const formatFormName = (formType) => {
    const formNames = {
      'newClearance': 'New Clearance Form',
      'provAdmission': 'Provisional Admission Form',
      'personalRecord': 'Personal Record Form',
      'personalRecord2': 'Family Information Form',
      'affidavit': 'Rules & Regulations Affidavit'
    };
    return formNames[formType] || formType;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  // Render loading state
  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error! </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  // Prepare items and stats
  const visibleItems = getVisibleItems();
  const totalPendingItems = visibleItems.length;
  const pendingForms = pendingItems.forms.length;
  const pendingDocuments = pendingItems.documents.length;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
        <p className="text-gray-500 mt-1">Manage and review pending forms and documents</p>
      </div>

      {/* Quick Summary Cards */}
      <section className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Total Pending Items Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="rounded-full bg-yellow-100 p-3">
                  <FaClipboardList className="text-yellow-700 text-xl" />
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                  Pending
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-500">Total Pending Items</h3>
                <p className="text-2xl font-semibold mt-1 text-gray-900">{totalPendingItems}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <button 
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="text-yellow-600 hover:text-yellow-800 text-sm font-medium flex items-center"
                >
                  {refreshing ? (
                    <><FiRefreshCw className="mr-1 animate-spin" /> Refreshing</>
                  ) : (
                    <>Refresh <FaChevronRight className="ml-1 text-xs" /></>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Pending Forms Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="rounded-full bg-blue-100 p-3">
                  <FaClipboardList className="text-blue-700 text-xl" />
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                  Forms
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-500">Pending Forms</h3>
                <p className="text-2xl font-semibold mt-1 text-gray-900">{pendingForms}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <button 
                  onClick={() => setActiveTab('forms')}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                >
                  View Forms <FaChevronRight className="ml-1 text-xs" />
                </button>
              </div>
            </div>
          </div>

          {/* Pending Documents Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="rounded-full bg-green-100 p-3">
                  <FaFileAlt className="text-green-700 text-xl" />
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
                  Documents
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-500">Pending Documents</h3>
                <p className="text-2xl font-semibold mt-1 text-gray-900">{pendingDocuments}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <button 
                  onClick={() => setActiveTab('documents')}
                  className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center"
                >
                  View Documents <FaChevronRight className="ml-1 text-xs" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filtering Section */}
      <section className="mb-8 bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by student name, document type..."
              className="pl-10 w-full h-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Tabs */}
          <div className="flex items-center space-x-2">
            {['all', 'forms', 'documents'].map(tab => (
              <button
                key={tab}
                className={`px-3 py-2 rounded-md flex items-center ${
                  activeTab === tab
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'all' && 'All'}
                {tab === 'forms' && <><FaClipboardList className="mr-1" /> Forms</>}
                {tab === 'documents' && <><FaFileAlt className="mr-1" /> Documents</>}
              </button>
            ))}
          </div>
        </div>
        
        {/* Date Filter Buttons */}
        <div className="mt-4 flex items-center">
          <div className="mr-3 flex items-center">
            <FaSearch className="text-gray-500 mr-2" />
            <span className="text-sm text-gray-500">Filter by Date:</span>
          </div>
          <div className="flex space-x-2">
            {['all', 'today', 'week', 'month'].map(filter => (
              <button
                key={filter}
                className={`px-3 py-1.5 rounded text-sm font-medium ${
                  selectedFilter === filter
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => setSelectedFilter(filter)}
              >
                {filter === 'all' ? 'All Time' : 
                 filter === 'today' ? 'Today' : 
                 filter === 'week' ? 'This Week' : 
                 'This Month'}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Pending Items Table */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        {visibleItems.length > 0 ? (
          <DataTable
            columns={[
              {
                name: "Student Name",
                selector: row => row.studentId?.fullName || row.owner?.fullName || "Unknown",
                sortable: true,
                cell: row => (
                  <div className="py-2 font-medium">
                    {row.studentId?.fullName || row.owner?.fullName || "Unknown"}
                  </div>
                )
              },
              {
                name: "Type",
                selector: row => row.itemType || (row.type ? 'Form' : 'Document'),
                sortable: true,
                cell: row => (
                  <div className="py-2 flex items-center">
                    {row.itemType === 'form' || row.type ? 
                      <FaClipboardList className="mr-2 text-blue-500" /> : 
                      <FaFileAlt className="mr-2 text-blue-500" />
                    }
                    <span>
                      {row.type ? formatFormName(row.type) : (row.documentType || 'Document')}
                    </span>
                  </div>
                )
              },
              {
                name: "Submitted",
                selector: row => row.submittedDate || row.createdAt,
                sortable: true,
                cell: row => (
                  <div className="py-2 text-gray-500 flex items-center">
                    <FiClock className="mr-1" />
                    {formatDate(row.submittedDate || row.createdAt)}
                  </div>
                )
              },
              {
                name: "Actions",
                cell: row => {
                  const isForm = row.type || row.itemType === 'form';
                  const itemId = row._id;
                  
                  // Determine the correct URL for the action links based on item type
                  let viewLink, approveLink, rejectLink;
                  
                  if (isForm) {
                    // Change this line to prioritize formType
                    const formType = row.formType || row.type;
                    viewLink = `/staff/review-form/${itemId}?type=${formType}`;
                    approveLink = `/staff/review-form/${itemId}?type=${formType}`;
                    rejectLink = `/staff/review-form/${itemId}?type=${formType}`;
                  } else {
                    viewLink = `/staff/review-document/${itemId}`;
                    approveLink = `/staff/review-document/${itemId}`;
                    rejectLink = `/staff/review-document/${itemId}`;
                  }
              
                  return (
                    <div className="py-2 flex space-x-3">
                      <Link
                        to={viewLink}
                        className="text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <FaEye className="mr-1" />
                        View
                      </Link>
                      <Link
                        to={approveLink}
                        className="text-green-600 hover:text-green-800 flex items-center"
                      >
                        <FaCheck className="mr-1" />
                        Approve
                      </Link>
                      <Link
                        to={rejectLink}
                        className="text-red-600 hover:text-red-800 flex items-center"
                      >
                        <FaTimes className="mr-1" />
                        Reject
                      </Link>
                    </div>
                  );
                }
              }
            ]}
            data={visibleItems}
            customStyles={{
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
            }}
            highlightOnHover
            responsive
            pagination
            paginationPerPage={10}
            paginationRowsPerPageOptions={[5, 10, 15, 20]}
            noHeader
            className="rounded-lg overflow-hidden"
            emptyText="No pending items found"
          />
        ) : (
          <div className="py-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 rounded-full p-4">
                <FiClock className="h-12 w-12 text-blue-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Pending Items
            </h3>
            <p className="text-gray-500 mb-6">
              There are no items waiting for your approval at this time.
            </p>
            <Link
              to="/staff/dashboard"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Back to Dashboard
              <FaChevronRight className="ml-2" />
            </Link>
          </div>
        )}
      </section>

      {/* Notifications Section */}
      {visibleItems.length > 0 && (
        <section className="mt-8 bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center mb-4">
            <FaBell className="mr-2 text-purple-600" />
            <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
          </div>
          
          <div className="space-y-4">
            {[
              {
                type: 'deadline',
                message: 'Some pending items are approaching approval deadline',
                priority: 'high'
              },
              {
                type: 'system',
                message: 'Review process may take longer due to high volume',
                priority: 'medium'
              }
            ].map((notification, index) => (
              <div 
                key={index} 
                className="p-4 rounded-lg border border-gray-100 hover:shadow-sm transition duration-300"
              >
                <div className="flex items-start">
                  <div className={`
                    flex-shrink-0 rounded-full p-2 mr-3 ${
                      notification.priority === 'high' 
                        ? 'bg-red-100' 
                        : notification.priority === 'medium'
                          ? 'bg-yellow-100'
                          : 'bg-green-100'
                    }`}>
                    {notification.type === 'deadline' && (
                      <FiAlertTriangle className={`${
                        notification.priority === 'high' 
                          ? 'text-red-600' 
                          : notification.priority === 'medium'
                            ? 'text-yellow-600'
                            : 'text-green-600'
                      }`} />
                    )}
                    {notification.type === 'system' && (
                      <FiClock className={`${
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
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default StaffPending;