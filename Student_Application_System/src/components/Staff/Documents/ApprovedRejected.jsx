import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { 
  FiCheckCircle, 
  FiXCircle, 
  FiFilter, 
  FiFileText, 
  FiClock,
  FiAlertTriangle
} from "react-icons/fi";
import { IoIosArrowForward } from "react-icons/io";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../utils/api";
import { Toaster } from 'react-hot-toast';

// Component that can be reused for both Approved and Rejected items
const StaffApprovedRejected = ({ type }) => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [documents, setDocuments] = useState([]);
  const [forms, setForms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get filter from URL or default to "all"
  const initialFilter = searchParams.get("type") || "all";
  const [filter, setFilter] = useState(initialFilter);

  // Get the title based on the type prop
  const getTitle = () => {
    return type === "approved" ? "Approved Items" : "Rejected Items";
  };

  // Get the icon based on the type prop
  const getIcon = () => {
    return type === "approved" ? FiCheckCircle : FiXCircle;
  };

  // Handle filter changes
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  // Update URL when filter changes
  useEffect(() => {
    console.log("Updating URL with filter:", filter);
    if (filter && filter !== "all") {
      setSearchParams({ type: filter });
    } else {
      setSearchParams({});
    }
  }, [filter, setSearchParams]);

  // Update filter state if URL param changes
  useEffect(() => {
    const typeParam = searchParams.get("type");
    if (typeParam) {
      console.log("URL param changed to:", typeParam);
      setFilter(typeParam);
    } else {
      console.log("No URL param, setting filter to all");
      setFilter("all");
    }
  }, [searchParams]);

  // Fetch data
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch documents
        console.log(`Fetching ${type} documents...`);
        const documentsResponse = await api.get(`/documents/${type}-by-me`);
        setDocuments(documentsResponse.data);
        
        // Fetch forms
        console.log(`Fetching ${type} forms...`);
        const formsResponse = await api.get(`/clearance/forms/${type}-by-me`);
        setForms(formsResponse.data);
      } catch (err) {
        console.error(`Error fetching ${type} items:`, err);
        setError(`Failed to load ${type} items. Please try again later.`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, [type]);

  // Filter items based on the selected filter
  const getFilteredItems = () => {
    console.log("Filtering items with filter:", filter);
    if (filter === "documents") {
      return { documents, forms: [] };
    }
    if (filter === "forms") {
      return { documents: [], forms };
    }
    return { documents, forms };
  };

  const { documents: filteredDocuments, forms: filteredForms } = getFilteredItems();
  const hasNoItems = filteredDocuments.length === 0 && filteredForms.length === 0;
  const Icon = getIcon();

  // Format date helper function
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  // Helper function to get readable form type names
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

  return (
    <div
      style={{ backgroundColor: "#F6F6F6" }}
      className="w-full h-full overflow-auto"
    >
      <Toaster position="top-right" />
      <div className="text-2xl font-bold text-[#1E3A8A] mx-6 flex items-center">
        <Icon className="mr-2" />
        <h2 className="m-2">{getTitle()}</h2>
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
            <h3 className="text-gray-500 text-sm">Total {type === "approved" ? "Approved" : "Rejected"}</h3>
            <p className="text-2xl font-bold text-[#1E3A8A]">
              {isLoading ? (
                <div className="animate-pulse h-8 w-8 bg-gray-300 rounded"></div>
              ) : (
                documents.length + forms.length
              )}
            </p>
          </div>
          <Icon className="text-4xl" style={{ color: type === "approved" ? "#4ADE80" : "#EF4444" }} />
        </div>
        
        <div className="bg-white rounded-md shadow-sm p-4 flex items-center justify-between">
          <div>
            <h3 className="text-gray-500 text-sm">{type === "approved" ? "Approved" : "Rejected"} Documents</h3>
            <p className="text-2xl font-bold text-[#1E3A8A]">
              {isLoading ? (
                <div className="animate-pulse h-8 w-8 bg-gray-300 rounded"></div>
              ) : (
                documents.length
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
            <h3 className="text-gray-500 text-sm">{type === "approved" ? "Approved" : "Rejected"} Forms</h3>
            <p className="text-2xl font-bold text-[#1E3A8A]">
              {isLoading ? (
                <div className="animate-pulse h-8 w-8 bg-gray-300 rounded"></div>
              ) : (
                forms.length
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
          <Icon className={`mx-auto text-5xl ${type === "approved" ? "text-green-500" : "text-red-500"} mb-4`} />
          <h2 className="text-xl font-semibold mb-2">No {type} items</h2>
          <p className="text-gray-600">
            You haven't {type === "approved" ? "approved" : "rejected"} any {filter !== "all" ? filter : "documents or forms"} yet.
          </p>
        </div>
      ) : (
        <>
          {/* Documents Section */}
          {(filter === "all" || filter === "documents") && (
            <>
              <div className="flex items-center mb-3 mx-7">
                <h2 className="text-lg font-medium text-[#1E3A8A]">{type === "approved" ? "Approved" : "Rejected"} Documents</h2>
                {filteredDocuments.length > 0 && (
                  <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    {filteredDocuments.length}
                  </span>
                )}
              </div>
              
              {filteredDocuments.length === 0 ? (
                <div className="mx-5 bg-white rounded-lg shadow-sm p-6 text-center mb-6">
                  <FiFileText className="mx-auto text-4xl text-gray-300 mb-2" />
                  <p className="text-gray-500">No {type} documents found</p>
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
                            Date {type === "approved" ? "Approved" : "Rejected"}
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredDocuments.map((doc) => (
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
                              {formatDate(doc.reviewDate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                              <a
                                href={`/staff/review-document/${doc._id}`}
                                className="text-[#1E3A8A] hover:text-[#152a63] hover:underline"
                              >
                                View Details
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

          {/* Forms Section */}
          {(filter === "all" || filter === "forms") && (
            <>
              <div className="flex items-center mb-3 mx-7">
                <h2 className="text-lg font-medium text-[#1E3A8A]">{type === "approved" ? "Approved" : "Rejected"} Forms</h2>
                {filteredForms.length > 0 && (
                  <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    {filteredForms.length}
                  </span>
                )}
              </div>
              
              {filteredForms.length === 0 ? (
                <div className="mx-5 bg-white rounded-lg shadow-sm p-6 text-center">
                  <FiClock className="mx-auto text-4xl text-gray-300 mb-2" />
                  <p className="text-gray-500">No {type} forms found</p>
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
                            Date {type === "approved" ? "Approved" : "Rejected"}
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredForms.map((form) => (
                          <tr key={form._id || form.id} className="hover:bg-gray-50">
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
                              {formatDate(form.approvedDate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                              <a
                                href={`/staff/review-form/${form._id || form.id}?formType=${form.type}`}
                                className="text-[#1E3A8A] hover:text-[#152a63] hover:underline"
                              >
                                View Details
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

// Export specialized components for approved and rejected items
export const StaffApproved = () => <StaffApprovedRejected type="approved" />;
export const StaffRejected = () => <StaffApprovedRejected type="rejected" />;

export default StaffApprovedRejected;