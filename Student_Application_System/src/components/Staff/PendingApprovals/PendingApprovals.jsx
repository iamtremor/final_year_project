import React, { useState, useEffect } from "react";
import { FiFileText, FiClock, FiCheckCircle, FiXCircle, FiFilter } from "react-icons/fi";
import { useAuth } from "../../../context/AuthContext"
import api from "../../../utils/api";

const StaffPendingApprovals = () => {
  const { user } = useAuth();
  const [pendingDocuments, setPendingDocuments] = useState([]);
  const [pendingForms, setPendingForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // "all", "documents", "forms"

  useEffect(() => {
    const fetchPendingItems = async () => {
      try {
        setLoading(true);
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
            if (user.department === 'Registrar' && !form.deputyRegistrarApproved) {
              return true;
            }
            if (!user.department.includes('HOD') && 
                !['Registrar', 'Student Support', 'Finance', 'Health Services', 'Library'].includes(user.department) &&
                !form.schoolOfficerApproved) {
              // Check if staff manages the student's department
              if (user.managedDepartments && form.studentId && form.studentId.department) {
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
        setLoading(false);
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

  const getDocumentStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs flex items-center">
            <FiCheckCircle className="mr-1" /> Approved
          </span>
        );
      case "rejected":
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs flex items-center">
            <FiXCircle className="mr-1" /> Rejected
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs flex items-center">
            <FiClock className="mr-1" /> Pending
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full p-8">
        <div className="animate-pulse text-lg">Loading pending approvals...</div>
      </div>
    );
  }

  const { documents, forms } = filteredItems();
  const hasNoItems = documents.length === 0 && forms.length === 0;

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold mb-2 md:mb-0">Pending Approvals</h1>
        
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
          <FiCheckCircle className="mx-auto text-5xl text-green-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No pending approvals</h2>
          <p className="text-gray-600">
            There are no documents or forms waiting for your approval at this time.
          </p>
        </div>
      ) : (
        <>
          {/* Pending Documents Section */}
          {documents.length > 0 && (
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold flex items-center">
                  <FiFileText className="mr-2" /> Pending Documents ({documents.length})
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
                        Date Uploaded
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
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
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getDocumentStatusBadge(doc.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <a
                            href={`/staff/review-document/${doc._id}`}
                            className="text-blue-600 hover:text-blue-900 hover:underline"
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

          {/* Pending Forms Section */}
          {forms.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold flex items-center">
                  <FiClock className="mr-2" /> Pending Forms ({forms.length})
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
                        Submission Date
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
                          {new Date(form.submittedDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <a
                            href={`/staff/review-form/${form.id}?formType=${form.type}`}
                            className="text-blue-600 hover:text-blue-900 hover:underline"
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

export default StaffPendingApprovals;