// backend/components/Staff/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { 
  FaRegClock, 
  FaClipboardCheck, 
  FaRegTimesCircle, 
  FaChevronRight,
  FaClipboardList,
  FaFileAlt,
  FaBell
} from "react-icons/fa";
import { FiClock, FiCheckCircle, FiXCircle, FiAlertTriangle } from "react-icons/fi";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../utils/api";

const StaffDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [pendingForms, setPendingForms] = useState([]);
  const [pendingDocuments, setPendingDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        const [
          dashboardResponse, 
          formsResponse, 
          documentsResponse
        ] = await Promise.all([
          api.get('/dashboard/staff'),
          api.get('/clearance/forms/pending'),
          api.get('/documents/staff/approvable')
        ]);
  
        setDashboardData(dashboardResponse.data);
        setPendingForms(formsResponse.data.forms || []);
        setPendingDocuments(documentsResponse.data);
  
        setLoading(false);
      } catch (error) {
        console.error('Dashboard Fetch Error:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };
  
    fetchDashboardData();
  }, []);

  // Function to get relevant forms
  const getRelevantForms = () => {
    if (!user || !pendingForms) return [];
  
    return pendingForms.filter(form => {
      if (user.department === 'Registrar') {
        return form.formType === 'newClearance' && !form.deputyRegistrarApproved;
      }
      
      if (!user.department.includes('HOD')) {
        return (
          form.formType === 'newClearance' && 
          form.deputyRegistrarApproved && 
          !form.schoolOfficerApproved && 
          form.studentId?.department === user.department
        );
      }
  
      return true;
    });
  };

  // Columns for Forms DataTable
  // This is the forms columns section from StaffDashboard.jsx
// Focus on the Action column where we generate the link

const formsColumns = [
  {
    name: "Student Name",
    selector: row => row.studentId?.fullName || row.studentName || "Unknown Student",
    sortable: true,
    cell: row => (
      <div className="py-2 font-medium">{row.studentId?.fullName || row.studentName || "Unknown Student"}</div>
    )
  },
  {
    name: "Form Type",
    selector: row => row.formType,
    sortable: true,
    cell: row => (
      <div className="py-2">
        {row.formType === 'newClearance' ? 'New Clearance Form' : 
         row.formType === 'provAdmission' ? 'Provisional Admission Form' :
         row.formType === 'personalRecord' ? 'Personal Record Form' :
         row.formType === 'personalRecord2' ? 'Family Information Form' :
         row.formType === 'affidavit' ? 'Rules & Regulations Affidavit' :
         'Unknown Form'}
      </div>
    )
  },
  {
    name: "Submitted Date",
    selector: row => row.submittedDate,
    sortable: true,
    cell: row => (
      <div className="py-2 text-gray-500">
        {new Date(row.submittedDate).toLocaleDateString()}
      </div>
    )
  },
  {
    name: "Status",
    selector: row => row.status,
    cell: row => (
      <div className="py-2">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <FiClock className="mr-1" /> Pending Review
        </span>
      </div>
    )
  },
  {
    name: "Action",
    cell: row => (
      <Link 
        // The key change is here - use the actual formType value, not just "forms"
        to={`/staff/review-form/${row._id}?type=${row.formType}`}
        className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded text-sm"
      >
        Review
      </Link>
    )
  }
];

  // Columns for Documents DataTable
  const documentsColumns = [
    {
      name: "Student Name",
      selector: row => row.owner?.fullName || "Unknown Student",
      sortable: true,
      cell: row => (
        <div className="py-2 font-medium">{row.owner?.fullName || "Unknown Student"}</div>
      )
    },
    {
      name: "Document Type",
      selector: row => row.documentType,
      sortable: true
    },
    {
      name: "Uploaded Date",
      selector: row => row.createdAt,
      sortable: true,
      cell: row => (
        <div className="py-2 text-gray-500">
          {new Date(row.createdAt).toLocaleDateString()}
        </div>
      )
    },
    {
      name: "Status",
      cell: row => (
        <div className="py-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <FiClock className="mr-1" /> Pending Review
          </span>
        </div>
      )
    },
    {
      name: "Action",
      cell: row => (
        <Link 
          to={`/staff/review-document/${row._id}`}
          className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded text-sm"
        >
          Review
        </Link>
      )
    }
  ];

  // Render loading state
  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  // Render error state
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

  // Get relevant forms
  const relevantForms = getRelevantForms();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Staff Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome to your operational control center</p>
      </div>
      {/* Quick Summary Cards */}
      <section className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Pending Approvals Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="rounded-full bg-yellow-100 p-3">
                  <FaRegClock className="text-yellow-700 text-xl" />
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                  Pending
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-500">Pending Approvals</h3>
                <p className="text-2xl font-semibold mt-1 text-gray-900">
                  {dashboardData?.stats?.pendingApprovals.forms + dashboardData?.stats?.pendingApprovals.documents}
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link to="/staff/pending-approvals" className="text-yellow-600 hover:text-yellow-800 text-sm font-medium flex items-center">
                  View all pending
                  <FaChevronRight className="ml-1 text-xs" />
                </Link>
              </div>
            </div>
          </div>

          {/* Approved Items Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="rounded-full bg-green-100 p-3">
                  <FaClipboardCheck className="text-green-700 text-xl" />
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
                  Approved
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-500">Approved Items</h3>
                <p className="text-2xl font-semibold mt-1 text-gray-900">
                  {dashboardData?.stats?.completedApprovals.forms + dashboardData?.stats?.completedApprovals.documents}
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link to="/staff/approved" className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center">
                  View all approved
                  <FaChevronRight className="ml-1 text-xs" />
                </Link>
              </div>
            </div>
          </div>

          {/* Rejected Items Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="rounded-full bg-red-100 p-3">
                  <FaRegTimesCircle className="text-red-700 text-xl" />
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-700">
                  Rejected
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-500">Rejected Items</h3>
                <p className="text-2xl font-semibold mt-1 text-gray-900">0</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link to="/staff/rejected" className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center">
                  View rejected items
                  <FaChevronRight className="ml-1 text-xs" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pending Forms Section */}
      <section className="mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center">
            <FaClipboardList className="mr-2 text-[#1E3A8A]" />
            <h2 className="text-lg font-bold text-gray-900">Pending Forms</h2>
          </div>
          <div className="p-6">
            {relevantForms.length > 0 ? (
              <DataTable
                columns={formsColumns}
                data={relevantForms}
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
                <FiClock className="h-10 w-10 text-gray-400 mx-auto" />
                <p className="mt-3 text-gray-500">No forms are pending</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Pending Documents Section */}
      <section className="mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center">
            <FaFileAlt className="mr-2 text-[#1E3A8A]" />
            <h2 className="text-lg font-bold text-gray-900">Pending Documents</h2>
          </div>
          <div className="p-6">
            {pendingDocuments.length > 0 ? (
              <DataTable
                columns={documentsColumns}
                data={pendingDocuments}
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
                <FiClock className="h-10 w-10 text-gray-400 mx-auto" />
                <p className="mt-3 text-gray-500">No documents are pending</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Notifications Section */}
      {dashboardData?.notifications && dashboardData.notifications.length > 0 && (
        <section>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center">
              <FaBell className="mr-2 text-[#1E3A8A]" />
              <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {dashboardData.notifications.map((notification, index) => (
                  <div 
                    key={index} 
                    className="p-4 rounded-lg border border-gray-100 hover:shadow-sm transition duration-300"
                  >
                    <div className="flex items-start">
                      <div className={`
                        p-2 rounded-full mr-3 flex-shrink-0
                        ${notification.status === 'success' ? 'bg-green-100' : 
                          notification.status === 'warning' ? 'bg-yellow-100' : 
                          notification.status === 'error' ? 'bg-red-100' : 'bg-blue-100'}
                      `}>
                        {notification.status === 'success' ? <FiCheckCircle className="text-green-600" /> :
                         notification.status === 'warning' ? <FiAlertTriangle className="text-yellow-600" /> :
                         notification.status === 'error' ? <FiXCircle className="text-red-600" /> :
                         <FiClock className="text-blue-600" />
                        }
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">{notification.title}</h4>
                        <p className="text-sm text-gray-600">{notification.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default StaffDashboard;