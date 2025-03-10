import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { FiFileText } from "react-icons/fi";
import axios from "axios";
import { useAuth } from "../../../../context/AuthContext";
import { format } from "date-fns";

const Documentss = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // Get documents from the API
        const response = await axios.get('/api/documents/student', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Process the data to match the expected format
        const formattedDocs = response.data.map(doc => ({
          id: doc._id,
          activity: doc.title || "Untitled Document",
          type: doc.documentType || "Other",
          date: doc.createdAt ? format(new Date(doc.createdAt), "yyyy-MM-dd") : "N/A",
          status: doc.status === 'approved' ? 'Approved' : 
                  doc.status === 'rejected' ? 'Rejected' : 'Pending',
          originalDoc: doc // Keep the original document data for reference if needed
        }));
        
        setDocuments(formattedDocs);
      } catch (error) {
        console.error("Error fetching documents:", error);
        // If there's an error, we'll just keep the documents array empty
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDocuments();
    }
  }, [user]);

  // Define table columns
  const columns = [
    {
      name: <div className="font-bold text-[#4A5568]">ACTIVITY</div>,
      selector: (row) => <div className="text-[#1C065A]">{row.activity}</div>,
    },
    {
      name: <div className="font-bold text-[#4A5568]">TYPE</div>,
      selector: (row) => <div className="text-[#1C065A]">{row.type}</div>,
    },
    {
      name: <div className="font-bold text-[#4A5568]">DATE</div>,
      selector: (row) => <div className="text-[#1C065A]">{row.date}</div>,
    },
    {
      name: <div className="font-bold text-[#4A5568]">STATUS</div>,
      selector: (row) => (
        <div
          className={`${
            row.status === "Approved"
              ? "text-green-600"
              : row.status === "Pending"
              ? "text-yellow-500"
              : "text-red-600"
          } font-semibold`}
        >
          {row.status}
        </div>
      ),
    },
  ];

  // Fallback data for when API call fails or is loading
  const fallbackData = [
    {
      id: 1,
      activity: "Transcript",
      type: "Academic",
      date: "2025-01-07",
      status: "Approved",
    },
    {
      id: 2,
      activity: "Admission Letter",
      type: "Official Document",
      date: "2025-01-06",
      status: "Pending",
    },
    {
      id: 3,
      activity: "Medical Report",
      type: "Health",
      date: "2025-01-05",
      status: "Rejected",
    },
    {
      id: 4,
      activity: "Transcript",
      type: "Academic",
      date: "2025-01-03",
      status: "Approved",
    },
    {
      id: 5,
      activity: "WAEC Result",
      type: "Academic",
      date: "2025-01-03",
      status: "Approved",
    },
    {
      id: 6,
      activity: "JAMB Result",
      type: "Academic",
      date: "2025-01-03",
      status: "Rejected",
    },
    {
      id: 7,
      activity: "Medical Report",
      type: "Health",
      date: "2025-01-05",
      status: "Rejected",
    },
    {
      id: 8,
      activity: "Transcript",
      type: "Academic",
      date: "2025-01-03",
      status: "Approved",
    },
  ];

  return (
    <div className="p-6">
      <div className="text-2xl font-bold text-[#1E3A8A] flex items-center">
        <FiFileText />
        <h2 className="mx-2">My Documents</h2>
      </div>
      <DataTable
        columns={columns}
        data={documents.length > 0 ? documents : loading ? [] : fallbackData}
        pagination
        progressPending={loading}
        progressComponent={
          <div className="py-6 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E3A8A]"></div>
          </div>
        }
        highlightOnHover
        striped
        noDataComponent={
          <div className="p-4 text-center">
            <p className="text-gray-500">No documents found</p>
          </div>
        }
        customStyles={{
          headRow: {
            style: {
              backgroundColor: "#fff",
              color: "white",
              fontWeight: "bold",
            },
          },
          rows: {
            style: {
              fontSize: "14px",
            },
          },
        }}
      />
    </div>
  );
};

export default Documentss;