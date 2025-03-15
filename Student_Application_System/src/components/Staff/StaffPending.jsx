import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import api from "../../utils/api";
import { 
  FaSearch, 
  FaFilter, 
  FaFileAlt, 
  FaClipboardList, 
  FaEye, 
  FaCheck, 
  FaTimes 
} from "react-icons/fa";
import { MdPendingActions } from "react-icons/md";
import { FiClock } from "react-icons/fi";

const StaffPending = () => {
  const { user } = useAuth();
  const [pendingItems, setPendingItems] = useState({
    forms: [],
    documents: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'forms', 'documents'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all', 'today', 'week', 'month'

  // Fetch pending items
  useEffect(() => {
    const fetchPendingItems = async () => {
      try {
        setLoading(true);
        
        // Fetch pending forms
        const formsResponse = await api.get('/clearance/forms/pending?formType=newClearance');
        
        // Fetch pending documents
        const documentsResponse = await api.get('/documents/staff/approvable');
        
        // Process forms data - handle both object and array responses
        let processedForms = [];
        if (formsResponse.data) {
          if (Array.isArray(formsResponse.data)) {
            processedForms = formsResponse.data;
          } else {
            // If it's an object with form types as keys
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
    };

    fetchPendingItems();
  }, []);

  // Filter items based on current filter and search term
  const getFilteredItems = () => {
    // First apply date filter
    const filteredByDate = {
      forms: filterByDate(pendingItems.forms),
      documents: filterByDate(pendingItems.documents)
    };
    
    // Then apply search filter
    if (!searchTerm) {
      return filteredByDate;
    }
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return {
      forms: filteredByDate.forms.filter(form => {
        return (
          (form.studentId?.fullName || '').toLowerCase().includes(lowerSearchTerm) ||
          (form.studentName || '').toLowerCase().includes(lowerSearchTerm) ||
          (form.type || '').toLowerCase().includes(lowerSearchTerm) ||
          (form.formName || '').toLowerCase().includes(lowerSearchTerm)
        );
      }),
      documents: filteredByDate.documents.filter(doc => {
        return (
          (doc.owner?.fullName || '').toLowerCase().includes(lowerSearchTerm) ||
          (doc.title || '').toLowerCase().includes(lowerSearchTerm) ||
          (doc.documentType || '').toLowerCase().includes(lowerSearchTerm)
        );
      })
    };
  };

  // Apply date filter
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

  // Get items based on active tab
  const getVisibleItems = () => {
    const filteredItems = getFilteredItems();
    
    if (activeTab === 'forms') {
      return filteredItems.forms;
    } else if (activeTab === 'documents') {
      return filteredItems.documents;
    } else {
      // Return combined array for 'all' tab with type property
      return [
        ...filteredItems.forms.map(form => ({ ...form, itemType: 'form' })),
        ...filteredItems.documents.map(doc => ({ ...doc, itemType: 'document' }))
      ];
    }
  };

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
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
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

  const visibleItems = getVisibleItems();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center mb-6">
        <MdPendingActions size={30} className="text-yellow-600 mr-2" />
        <h2 className="text-2xl font-bold text-[#1E3A8A]">Pending Approvals</h2>
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
              placeholder="Search by student name, document type..."
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
            {renderFilterButton('today', 'Today')}
            {renderFilterButton('week', 'This Week')}
            {renderFilterButton('month', 'This Month')}
          </div>
        </div>
      </div>

      {/* Pending Items List */}
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
                    Submitted
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {visibleItems.map((item, index) => {
                  // Determine if this is a form or document
                  const isForm = item.itemType === 'form' || !item.itemType;
                  
                  // Get appropriate data based on item type
                  const studentName = isForm 
                    ? (item.studentId?.fullName || item.studentName || 'Unknown Student')
                    : (item.owner?.fullName || 'Unknown Student');
                  
                  const itemTitle = isForm
                    ? formatFormName(item.type || item.formName)
                    : (item.title || 'Untitled Document');
                  
                  const submittedDate = isForm
                    ? formatDate(item.submittedDate)
                    : formatDate(item.createdAt);
                  
                  const itemType = isForm
                    ? 'Form'
                    : (item.documentType || 'Document');
                  
                  const itemId = isForm
                    ? item._id || item.id
                    : item._id;
                  
                  // Determine action link
                  const actionLink = isForm
                    ? `/staff/review-form/${itemId}?type=${item.type || ''}`
                    : `/staff/review-document/${itemId}`;
                  
                  return (
                    <tr key={`${index}-${itemId}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {studentName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {isForm ? <FaClipboardList className="text-blue-500 mr-2" /> : <FaFileAlt className="text-blue-500 mr-2" />}
                          <span className="text-sm text-gray-900">{itemType}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{itemTitle}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 flex items-center">
                          <FiClock className="mr-1 text-gray-400" />
                          {submittedDate}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-3">
                          <Link
                            to={actionLink}
                            className="text-blue-600 hover:text-blue-900 flex items-center"
                          >
                            <FaEye className="mr-1" />
                            View
                          </Link>
                          <Link
                            to={actionLink}
                            className="text-green-600 hover:text-green-900 flex items-center"
                          >
                            <FaCheck className="mr-1" />
                            Approve
                          </Link>
                          <Link
                            to={actionLink}
                            className="text-red-600 hover:text-red-900 flex items-center"
                          >
                            <FaTimes className="mr-1" />
                            Reject
                          </Link>
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
            <FiClock className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No pending items</h3>
            <p className="mt-1 text-sm text-gray-500">There are no items waiting for your approval at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffPending;