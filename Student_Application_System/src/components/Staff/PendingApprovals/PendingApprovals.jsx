import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { 
  FiFileText, 
  FiClock, 
  FiCheckCircle, 
  FiXCircle, 
  FiFilter,
  FiAlertTriangle
} from "react-icons/fi";
import { IoIosArrowForward } from "react-icons/io";
import { MdOutlineSpaceDashboard } from "react-icons/md";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../utils/api";
import toast, { Toaster } from "react-hot-toast";

const StaffPendingApprovals = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pendingDocuments, setPendingDocuments] = useState([]);
  const [pendingForms, setPendingForms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get filter from URL or default to "all"
  const initialFilter = searchParams.get("type") || "all";
  const [filter, setFilter] = useState(initialFilter);

  // Function to handle filter changes
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    if (newFilter !== "all") {
      setSearchParams({ type: newFilter });
    } else {
      setSearchParams({});
    }
  };

  // Update filter if URL param changes
  useEffect(() => {
    const typeParam = searchParams.get("type");
    if (typeParam && typeParam !== filter) {
      setFilter(typeParam);
    } else if (!typeParam && filter !== "all") {
      setFilter("all");
    }
  }, [searchParams, filter]);

  useEffect(() => {
    const fetchPendingItems = async () => {
      if (!user) return;
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch documents that staff can approve
        const documentsResponse = await api.get("/documents/staff/approvable");
        setPendingDocuments(documentsResponse.data);
        
        // Fetch forms pending staff approval
        const formsResponse = await api.get("/clearance/forms/pending");
        // Filter forms to show only those that can be approved by this staff member
        const filteredForms = formsResponse.data.forms.filter(form => {
          // For New Clearance Forms
          if (form.type === 'newClearance') {
            if (user?.department === 'Registrar' && !form.deputyRegistrarApproved) {
              return true;
            }
            if (user?.department && !user.department.includes('HOD') && 
                !['Registrar', 'Student Support', 'Finance', 'Health Services', 'Library'].includes(user.department) &&
                !form.schoolOfficerApproved) {
              // Check if staff manages the student's department
              if (user?.managedDepartments && form.studentId && form.studentId.department) {
                return user.managedDepartments.includes(form.studentId.department);
              }
            }
          }
          
          // For other forms, just show them
          return true;
        });
        
        setPendingForms(filteredForms);
      } catch (err) {
        console.error("Error fetching pending approvals:", err);
        setError("Failed to load pending approvals. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPendingItems();
  }, [user]);

  // Filter items based on the selected filter
  const filteredItems = () => {
    if (filter === "documents") return { documents: pendingDocuments, forms: [] };
    if (filter === "forms") return { documents: [], forms: pendingForms };
    return { documents: pendingDocuments, forms: pendingForms };
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  // Calculate days pending
  const calculateDaysPending = (dateString) => {
    if (!dateString) return "N/A";
    
    try {
      const submissionDate = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - submissionDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } catch (error) {
      return "N/A";
    }
  };

  // Get form type name
  const getFormTypeName = (type) => {
    switch (type) {
      case "newClearance":
        return "New Clearance Form";
      case "provAdmission":
        return "Provisional Admission Form";
      case "personalRecord":
        return "Personal Record Form";
      case "personalRecord2":
        return "Personal Record Form Part 2";
      case "affidavit":
        return "Rules & Affidavit Form";
      default:
        return type;
    }
  };

  const { documents, forms } = filteredItems();
  const hasNoItems = documents.length === 0 && forms.length === 0;

  return (
    <div
      style={{ backgroundColor: "#F6F6F6" }}
      className="w-full h-full overflow-auto"
    >
      <Toaster position="top-right" />
      <div className="text-2xl font-bold text-[#1E3A8A] mx-6 flex items-center">
        <FiClock />
        <h2 className="m-2">Pending Approvals</h2>
      </div>
      
      {error && (
        <div className="mx-5 mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700">
          <div className="flex">
            <FiAlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <div>
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Filter Section */}
      <div className="mx-5 mb-4 p-4 bg-white rounded-md shadow-sm">
        <div className="flex flex-wrap items-center justify-between">
          <h2 className="text-lg font-medium text-[#1E3A8A] mb-2 sm:mb-0">Filter Items</h2>
          
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => handleFilterChange("all")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                filter === "all"
                  ? "bg-white text-[#1E3A8A] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => handleFilterChange("documents")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                filter === "documents"
                  ? "bg-white text-[#1E3A8A] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Documents
            </button>
            <button
              onClick={() => handleFilterChange("forms")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                filter === "forms"
                  ? "bg-white text-[#1E3A8A] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Forms
            </button>
          </div>
        </div>
      </div>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-7 px-5">
        <div className="bg-white rounded-md shadow-sm p-4 flex items-center justify-between">
          <div>
            <h3 className="text-gray-500 text-sm">Total Pending</h3>
            <p className="text-2xl font-bold text-[#1E3A8A]">
              {isLoading ? (
                <div className="animate-pulse h-8 w-8 bg-gray-300 rounded"></div>
              ) : (
                pendingDocuments.length + pendingForms.length
              )}
            </p>
            <p className="text-xs text-gray-500">Awaiting your review</p>
          </div>
          <FiClock className="text-4xl text-[#1E3A8A]" />
        </div>
        
        <div className="bg-white rounded-md shadow-sm p-4 flex items-center justify-between">
          <div>
            <h3 className="text-gray-500 text-sm">Pending Documents</h3>
            <p className="text-2xl font-bold text-[#1E3A8A]">
              {isLoading ? (
                <div className="animate-pulse h-8 w-8 bg-gray-300 rounded"></div>
              ) : (
                pendingDocuments.length
              )}
            </p>
            <button 
              onClick={() => handleFilterChange("documents")}
              className="text-[12px] flex items-center text-[#1E3A8A] hover:underline"
            >
              View Documents
              <IoIosArrowForward className="ml-1" />
            </button>
          </div>
          <FiFileText className="text-4xl text-[#C3A135]" />
        </div>
        
        <div className="bg-white rounded-md shadow-sm p-4 flex items-center justify-between">
          <div>
            <h3 className="text-gray-500 text-sm">Pending Forms</h3>
            <p className="text-2xl font-bold text-[#1E3A8A]">
              {isLoading ? (
                <div className="animate-pulse h-8 w-8 bg-gray-300 rounded"></div>
              ) : (
                pendingForms.length
              )}
            </p>
            <button 
              onClick={() => handleFilterChange("forms")}
              className="text-[12px] flex items-center text-[#1E3A8A] hover:underline"
            >
              View Forms
              <IoIosArrowForward className="ml-1" />
            </button>
          </div>
          <FiClock className="text-4xl text-[#3B2774]" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1E3A8A]"></div>
        </div>
      ) : hasNoItems ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center mx-5">
          <FiCheckCircle className="mx-auto text-5xl text-green-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No pending approvals</h2>
          <p className="text-gray-600">
            There are no {filter !== "all" ? filter : "documents or forms"} waiting for your approval at this time.
          </p>
        </div>
      ) : (
        <>
          {/* Pending Documents Section */}
          {(filter === "all" || filter === "documents") && (
            <>
              <div className="flex items-center mb-3 mx-7">
                <h2 className="text-lg font-medium text-[#1E3A8A]">Pending Documents</h2>
                {documents.length > 0 && (
                  <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    {documents.length}
                  </span>
                )}
              </div>
              
              {documents.length === 0 ? (
                <div className="mx-5 bg-white rounded-lg shadow-sm p-6 text-center mb-6">
                  <FiFileText className="mx-auto text-4xl text-gray-300 mb-2" />
                  <p className="text-gray-500">No pending documents found</p>
                </div>
              ) : (
                <div className="mx-5 bg-white rounded-lg shadow-sm overflow-hidden mb-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Document
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Department
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Submitted
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Pending For
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {documents.map((doc) => (
                          <tr key={doc._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {doc.documentType}
                              </div>
                              <div className="text-sm text-gray-500">{doc.title}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {doc.owner?.fullName || "N/A"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {doc.owner?.applicationId || "N/A"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {doc.owner?.department || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(doc.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {calculateDaysPending(doc.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                              <a
                                href={`/staff/review-document/${doc._id}`}
                                className="text-[#1E3A8A] hover:text-[#152a63] hover:underline"
                              >
                                Review
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Pending Forms Section */}
          {(filter === "all" || filter === "forms") && (
            <>
              <div className="flex items-center mb-3 mx-7">
                <h2 className="text-lg font-medium text-[#1E3A8A]">Pending Forms</h2>
                {forms.length > 0 && (
                  <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    {forms.length}
                  </span>
                )}
              </div>
              
              {forms.length === 0 ? (
                <div className="mx-5 bg-white rounded-lg shadow-sm p-6 text-center">
                  <FiClock className="mx-auto text-4xl text-gray-300 mb-2" />
                  <p className="text-gray-500">No pending forms found</p>
                </div>
              ) : (
                <div className="mx-5 bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Form Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Department
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Submitted
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Pending For
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {forms.map((form) => (
                          <tr key={form.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {getFormTypeName(form.type)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {form.studentId?.fullName || form.studentName || "N/A"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {form.studentId?.applicationId || "N/A"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {form.studentId?.department || form.department || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(form.submittedDate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {calculateDaysPending(form.submittedDate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                              <a
                                href={`/staff/review-form/${form.id}?formType=${form.type}`}
                                className="text-[#1E3A8A] hover:text-[#152a63] hover:underline"
                              >
                                Review
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default StaffPendingApprovals;