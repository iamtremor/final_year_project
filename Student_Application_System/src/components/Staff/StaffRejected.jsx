import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";
import { 
  FaSearch, 
  FaFilter, 
  FaFileAlt, 
  FaClipboardList, 
  FaEye, 
  FaDownload, 
  FaCommentAlt 
} from "react-icons/fa";
import { MdOutlineError } from "react-icons/md";
import { FiCalendar } from "react-icons/fi";

const StaffRejected = () => {
  const { user } = useAuth();
  const [rejectedItems, setRejectedItems] = useState({
    forms: [],
    documents: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'forms', 'documents'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all', 'week', 'month', 'year'

  // Fetch rejected items
  useEffect(() => {
    const fetchRejectedItems = async () => {
      try {
        setLoading(true);
        
        // Get documents rejected by this staff member
        const rejectedDocsResponse = await api.get('/documents/rejected-by-me');
        
        // Get forms rejected by this staff member
        const rejectedFormsResponse = await api.get('/clearance/forms/rejected-by-me');
        
        setRejectedItems({
          forms: rejectedFormsResponse.data || [],
          documents: rejectedDocsResponse.data || []
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching rejected items:', error);
        // Log the full error response
        console.log('Error details:', error.response?.data);
        setError(
          error.response?.data?.message || 
          'Failed to load rejected items. Please try again later.'
        );
        setLoading(false);
      }
    };
  
    fetchRejectedItems();
  }, []);

  // Format form name for display
  const formatFormName = (formType) => {
    switch (formType) {
      case 'newClearance': return 'New Clearance Form';
      case 'provAdmission': return 'Provisional Admission Form';
      case 'personalRecord': return 'Personal Record Form';
      case 'personalRecord2': return 'Family Information Form';
      case 'affidavit': return 'Rules & Regulations Affidavit';
      default: return formType;
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Apply date filter
  const filterByDate = (items) => {
    if (selectedFilter === 'all') return items;
    
    const now = new Date();
    let cutoffDate;
    
    switch (selectedFilter) {
      case 'week':
        cutoffDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        cutoffDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        cutoffDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        return items;
    }
    
    return items.filter(item => {
      const itemDate = new Date(item.rejectedDate || item.reviewDate);
      return itemDate >= cutoffDate;
    });
  };

  // Get items based on active tab and filters
  const getVisibleItems = () => {
    // Combine forms and documents with a common structure
    const combinedItems = [
      ...rejectedItems.forms.map(form => ({
        ...form,
        itemType: 'form',
        formType: form.type || form.formName,
        studentName: form.studentId?.fullName || form.studentName,
        rejectedDate: form.rejectedDate || form.submittedDate,
        feedback: form.feedback || 'No feedback provided'
      })),
      ...rejectedItems.documents.map(doc => ({
        ...doc,
        itemType: 'document',
        studentName: doc.owner?.fullName || 'Unknown Student',
        rejectedDate: doc.reviewDate,
        feedback: doc.feedback || 'No feedback provided'
      }))
    ];

    // First apply date filter
    const filteredByDate = filterByDate(combinedItems);
    
    // Then apply search filter
    if (!searchTerm) {
      return filteredByDate;
    }
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return filteredByDate.filter(item => 
      (item.studentName || '').toLowerCase().includes(lowerSearchTerm) ||
      (item.title || item.formType || '').toLowerCase().includes(lowerSearchTerm) ||
      (item.feedback || '').toLowerCase().includes(lowerSearchTerm)
    );
  };

  // Render filter button
  const renderFilterButton = (value, label) => (
    <button
      className={`px-3 py-1.5 rounded text-sm font-medium ${
        selectedFilter === value
          ? 'bg-blue-600 text-white'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      }`}
      onClick={() => setSelectedFilter(value)}
    >
      {label}
    </button>
  );

  // Show loading state
  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  // Get visible items based on filters
  const visibleItems = getVisibleItems();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center mb-6">
        <MdOutlineError size={30} className="text-red-600 mr-2" />
        <h2 className="text-2xl font-bold text-[#1E3A8A]">Rejected Items</h2>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by student name, document type, feedback..."
              className="pl-10 w-full h-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Tabs */}
          <div className="flex items-center space-x-2">
            <button
              className={`px-3 py-2 rounded-md ${
                activeTab === 'all'
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab('all')}
            >
              All
            </button>
            <button
              className={`px-3 py-2 rounded-md flex items-center ${
                activeTab === 'forms'
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab('forms')}
            >
              <FaClipboardList className="mr-1" />
              Forms
            </button>
            <button
              className={`px-3 py-2 rounded-md flex items-center ${
                activeTab === 'documents'
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab('documents')}
            >
              <FaFileAlt className="mr-1" />
              Documents
            </button>
          </div>
        </div>
        
        {/* Date Filter Buttons */}
        <div className="mt-4 flex items-center">
          <div className="mr-3 flex items-center">
            <FaFilter className="text-gray-500 mr-2" />
            <span className="text-sm text-gray-500">Filter by:</span>
          </div>
          <div className="flex space-x-2">
            {renderFilterButton('all', 'All Time')}
            {renderFilterButton('week', 'Past Week')}
            {renderFilterButton('month', 'Past Month')}
            {renderFilterButton('year', 'Past Year')}
          </div>
        </div>
      </div>

      {/* Rejected Items List */}
      <div className="bg-white rounded-lg shadow-md">
        {visibleItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title/Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rejected On
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Feedback
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {visibleItems.map((item, index) => {
                  const isForm = item.itemType === 'form';
                  
                  return (
                    <tr key={`${index}-${item._id}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {item.studentName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {isForm ? (
                            <FaClipboardList className="text-red-500 mr-2" />
                          ) : (
                            <FaFileAlt className="text-red-500 mr-2" />
                          )}
                          <span className="text-sm text-gray-900">
                            {isForm ? formatFormName(item.formType) : item.documentType}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {item.title || formatFormName(item.formType)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 flex items-center">
                          <FiCalendar className="mr-1 text-gray-400" />
                          {formatDate(item.rejectedDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-red-600 flex items-start">
                          <FaCommentAlt className="mr-1 mt-1 flex-shrink-0" />
                          <span className="line-clamp-2">{item.feedback}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-3">
                          <Link
                            to={isForm 
                              ? `/staff/view-form/${item._id}?type=${item.formType}` 
                              : `/staff/view-document/${item._id}`
                            }
                            className="text-blue-600 hover:text-blue-900 flex items-center"
                          >
                            <FaEye className="mr-1" />
                            View
                          </Link>
                          
                          {!isForm && (
                            <button
                              onClick={() => window.location.href = `/documents/download/${item._id}`}
                              className="text-gray-600 hover:text-gray-900 flex items-center"
                            >
                              <FaDownload className="mr-1" />
                              Download
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center">
          <MdOutlineError className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No rejected items</h3>
          <p className="mt-1 text-sm text-gray-500">You haven't rejected any forms or documents yet.</p>
        </div>
      )}
    </div>
  </div>
);
};

export default StaffRejected;