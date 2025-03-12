import React, { useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import DataTable from "react-data-table-component";
import NewAnnouncement from "./NewAnnouncement";
import EditModal from "./EditModal";
import DeleteModal from "./DeleteModal";

const Announcements = () => {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [editModalIsOpen, setEditModalIsOpen] = useState(false);
  const [deleteModalIsOpen, setDeleteModalIsOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  const announcements = [
    {
      id: 1,
      title: "Enrollment Deadline",
      audience: "Students",
      date: "Jan 10, 2025",
      status: "Active",
    },
    {
      id: 2,
      title: "System Maintenance",
      audience: "Students & Staff",
      date: "Jan 5, 2025",
      status: "Scheduled",
    },
    {
      id: 3,
      title: "Document Submission Reminder",
      audience: "Staff",
      date: "Dec 25, 2024",
      status: "Expired",
    },
    {
      id: 4,
      title: "Medical Report Submission",
      audience: "Student",
      date: "Feb 14th, 2025",
      status: "Active",
    },
  ];

  // Function to handle edit click
  const handleEditClick = (announcement) => {
    setSelectedAnnouncement(announcement);
    setEditModalIsOpen(true);
  };
  
  // Function to handle delete click - fixed to pass the announcement
  const handleDeleteClick = (announcement) => {
    setSelectedAnnouncement(announcement);
    setDeleteModalIsOpen(true);
  };
  
  const columns = [
    { name: "Title", selector: (row) => row.title, sortable: true },
    { name: "Audience", selector: (row) => row.audience, sortable: true },
    {
      name: "Status",
      selector: (row) => (
        <div
          className={`${
            row.status === "Active"
              ? "text-green-600 bg-green-200 p-1 rounded"
              : row.status === "Expired"
              ? "text-red-600 bg-red-200 p-1 rounded"
              : "text-yellow-600 bg-yellow-200 p-1 rounded"
          } font-semibold `}
        >
          {row.status}
        </div>
      ),
      sortable: true,
    },
    { name: "Date Added", selector: (row) => row.date, sortable: true },
    {
      name: "Action",
      selector: (row) => (
        <div className="flex">
          <button
            className="text-blue-500 hover:text-blue-700 flex items-center"
            onClick={() => handleEditClick(row)}
          >
            <FaEdit className="mr-1" /> Edit
          </button>
          <button
            className="ml-2 text-red-500 hover:text-red-700 flex items-center"
            onClick={() => handleDeleteClick(row)}
          >
            <FaTrash className="mr-1" /> Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-[#0D0637] mb-4">
        New Announcements
      </h2>

      {/* Add New Announcement Button */}
      <button
        onClick={() => setModalIsOpen(true)}
        className="bg-[#C3A135] text-white px-4 py-2 rounded-md"
      >
        + New Announcement
      </button>

      <NewAnnouncement
        isOpen={modalIsOpen}
        onClose={() => setModalIsOpen(false)}
      />

      {/* Announcements Table */}
      <DataTable
        columns={columns}
        data={announcements}
        pagination
        highlightOnHover
        striped
      />

      {/* Edit Modal */}
      <EditModal
        isOpen={editModalIsOpen}
        onClose={() => setEditModalIsOpen(false)}
        announcement={selectedAnnouncement}
      />
      
      {/* Delete Modal - now passing selectedAnnouncement */}
      <DeleteModal
        isOpen={deleteModalIsOpen}
        onClose={() => setDeleteModalIsOpen(false)}
        announcement={selectedAnnouncement}
      />
    </div>
  );
};

export default Announcements;