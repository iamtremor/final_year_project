import React, { useState, useEffect } from "react";
import { FiCheckCircle, FiXCircle, FiFilter, FiFileText, FiClock } from "react-icons/fi";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../utils/api";

// Component that can be reused for both Approved and Rejected items
const StaffApprovedRejected = ({ type }) => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // "all", "documents", "forms"

  // Get the title based on the type prop
  const getTitle = () => {
    return type === "approved" ? "Approved Items" : "Rejected Items";
  };

  // Get the icon based on the type prop
  const getIcon = () => {
    return type === "approved" ? FiCheckCircle : FiXCircle;
  };

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch documents
        const documentsResponse = await api.get(`/documents/${type}-by-me`);
        setDocuments(documentsResponse.data);
        
        // Fetch forms
        const formsResponse = await api.get(`/clearance/forms/${type}-by-me`);
        setForms(formsResponse.data);
      } catch (err) {
        console.error(`Error fetching ${type} items:`, err);
        setError(`Failed to load ${type} items. Please try again later.`);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [type]);

  // Filter items based on the selected filter
  const filteredItems = () => {
    if (filter === "documents") return { documents, forms: [] };
    if (filter === "forms") return { documents: [], forms };
    return { documents, forms };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full p-8">
        <div className="animate-pulse text-lg">Loading {type} items...</div>
      </div>
    );
  }

  const { documents: filteredDocuments, forms: filteredForms } = filteredItems();
  const hasNoItems = filteredDocuments.length === 0 && filteredForms.length === 0;
  const Icon = getIcon();

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold mb-2 md:mb-0">
          <Icon className="inline mr-2" /> {getTitle()}
        </h1>
        
        <div className="flex items-center">
          <FiFilter className="mr-2 text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-white border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Items</option>
            <option value="documents">Documents Only</option>
            <option value="forms">Forms Only</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-md text-red-600 mb-6">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {hasNoItems ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Icon className={`mx-auto text-5xl ${type === "approved" ? "text-green-500" : "text-red-500"} mb-4`} />
          <h2 className="text-xl font-semibold mb-2">No {type} items</h2>
          <p className="text-gray-600">
            You haven't {type === "approved" ? "approved" : "rejected"} any documents or forms yet.
          </p>
        </div>
      ) : (
        <>
          {/* Documents Section */}
          {filteredDocuments.length > 0 && (
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold flex items-center">
                  <FiFileText className="mr-2" /> {type === "approved" ? "Approved" : "Rejected"} Documents ({filteredDocuments.length})
                </h2>
              </div>
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
                          {doc.reviewDate ? new Date(doc.reviewDate).toLocaleDateString() : "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <a
                            href={`/staff/review-document/${doc._id}`}
                            className="text-blue-600 hover:text-blue-900 hover:underline"
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

          {/* Forms Section */}
          {filteredForms.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold flex items-center">
                  <FiClock className="mr-2" /> {type === "approved" ? "Approved" : "Rejected"} Forms ({filteredForms.length})
                </h2>
              </div>
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
                          {form.approvedDate ? new Date(form.approvedDate).toLocaleDateString() : "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <a
                            href={`/staff/review-form/${form._id || form.id}?formType=${form.type}`}
                            className="text-blue-600 hover:text-blue-900 hover:underline"
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
    </div>
  );
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

// Export specialized components for approved and rejected items
export const StaffApproved = () => <StaffApprovedRejected type="approved" />;
export const StaffRejected = () => <StaffApprovedRejected type="rejected" />;

export default StaffApprovedRejected;