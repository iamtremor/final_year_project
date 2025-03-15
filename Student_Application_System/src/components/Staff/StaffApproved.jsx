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
  FaRegCalendarCheck 
} from "react-icons/fa";
import { MdCheckCircle } from "react-icons/md";
import { FiCalendar } from "react-icons/fi";

const StaffApproved = () => {
  const { user } = useAuth();
  const [approvedItems, setApprovedItems] = useState({
    forms: [],
    documents: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'forms', 'documents'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all', 'week', 'month', 'year'

  // Fetch approved items
  useEffect(() => {
    const fetchApprovedItems = async () => {
      try {
        setLoading(true);
        
        // Get documents approved by this staff member
        // This endpoint would need to be created on the backend
        const approvedDocsResponse = await api.get('/documents/approved-by-me');
        
        // Get forms approved by this staff member
        // This endpoint would need to be created on the backend
        const approvedFormsResponse = await api.get('/clearance/forms/approved-by-me');
        
        setApprovedItems({
          forms: approvedFormsResponse.data || [],
          documents: approvedDocsResponse.data || []
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching approved items:', error);
        setError('Failed to load approved items. Please try again later.');
        setLoading(false);
        
        // For demo purposes, populate with sample data if API endpoints don't exist yet
        setApprovedItems({
          forms: [
            {
              id: '1',
              type: 'newClearance',
              studentName: 'John Smith',
              submittedDate: '2025-03-12T10:30:00',
              approvedDate: '2025-03-13T14:20:00'
            },
            {
              id: '2',
              type: 'provAdmission',
              studentName: 'Sarah Johnson',
              submittedDate: '2025-03-10T09:15:00',
              approvedDate: '2025-03-11T11:45:00'
            }
          ],
          documents: [
            {
              _id: '1',
              title: 'JAMB Result',
              documentType: 'JAMB Result',
              owner: { fullName: 'Michael Brown' },
              createdAt: '2025-03-09T08:30:00',
              reviewDate: '2025-03-10T13:20:00'
            },
            {
              _id: '2',
              title: 'Admission Letter',
              documentType: 'Admission Letter',
              owner: { fullName: 'Jessica Williams' },
              createdAt: '2025-03-08T14:45:00',
              reviewDate: '2025-03-09T10:10:00'
            }
          ]
        });
        setLoading(false);
      }
    };

    fetchApprovedItems();
  }, []);

  // Filter items based on current filter and search term
  const getFilteredItems = () => {
    // First apply date filter
    const filteredByDate = {
      forms: filterByDate(approvedItems.forms),
      documents: filterByDate(approvedItems.documents)
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
          (form.type || '').toLowerCase().includes(lowerSearchTerm)
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
      const itemDate = new Date(item.approvedDate || item.reviewDate);
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
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
        <MdCheckCircle size={30} className="text-green-600 mr-2" />
        <h2 className="text-2xl font-bold text-[#1E3A8A]">Approved Items</h2>
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
            {renderFilterButton('week', 'Past Week')}
            {renderFilterButton('month', 'Past Month')}
            {renderFilterButton('year', 'Past Year')}
          </div>
        </div>
      </div>

      {/* Approved Items List */}
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
                    Approved On
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
                  
                  const approvedDate = isForm
                    ? formatDate(item.approvedDate)
                    : formatDate(item.reviewDate);
                  
                  const itemType = isForm
                    ? 'Form'
                    : (item.documentType || 'Document');
                  
                  const itemId = isForm
                    ? item._id || item.id
                    : item._id;
                  
                  // Determine action link
                  const viewLink = isForm
                    ? `/staff/view-form/${itemId}?type=${item.type || ''}`
                    : `/staff/view-document/${itemId}`;
                  
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
                          {isForm ? <FaClipboardList className="text-green-500 mr-2" /> : <FaFileAlt className="text-green-500 mr-2" />}
                          <span className="text-sm text-gray-900">{itemType}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{itemTitle}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 flex items-center">
                          <FiCalendar className="mr-1 text-gray-400" />
                          {approvedDate}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-3">
                          <Link
                            to={viewLink}
                            className="text-blue-600 hover:text-blue-900 flex items-center"
                          >
                            <FaEye className="mr-1" />
                            View
                          </Link>
                          
                          {!isForm && (
                            <button
                              onClick={() => window.location.href = `/documents/download/${itemId}`}
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
            <FaRegCalendarCheck className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No approved items</h3>
            <p className="mt-1 text-sm text-gray-500">You haven't approved any forms or documents yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffApproved;