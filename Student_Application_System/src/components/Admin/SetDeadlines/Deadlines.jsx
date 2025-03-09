import React, { useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import DataTable from "react-data-table-component";
import NewDeadlineForm from "./NewDeadlineForm";
import WAECModal from "./DocumentModal";
import DeleteModal from "./Reminder";
import { IoEyeSharp } from "react-icons/io5";
import { FaRegBell } from "react-icons/fa";
import ViewModal from "./ViewModal";
import ReviewModal from "./ReviewModal";
import ReminderModal from "./ReminderModal";

const Deadlines = () => {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [editModalIsOpen, setEditModalIsOpen] = useState(false);
  const [deleteModalIsOpen, setDeleteModalIsOpen] = useState(false);
  const [selectedDeadline, setselectedDeadline] = useState(null);
  const [viewModalIsOpen, setViewModalIsOpen] = useState(false);
  const [reviewModalIsOpen, setReviewModalIsOpen] = useState(false);
  const [reminderModalIsOpen, setReminderModalIsOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const handleViewClick = (student) => {
    setSelectedStudent(student);
    setViewModalIsOpen(true);
  };

  const handleReviewClick = (student) => {
    setSelectedStudent(student);
    setReviewModalIsOpen(true);
  };

  const handleReminderClick = (student) => {
    setSelectedStudent(student);
    setReminderModalIsOpen(true);
  };
  const deadlines = [
    {
      id: 1,
      document: "O' Level Result",
      date: "Jan 10, 2025",
      submission: "120/150 Submitted",
      review: "90 Approved 30 pending",
    },
    {
      id: 2,
      document: "Birth Certificate",
      date: "Jan 5, 2025",
      submission: "90/150 Submitted",
      review: "40 Approved 50 pending",
    },
    {
      id: 3,
      document: "Passport",
      date: "Dec 25, 2024",
      submission: "55/150 Submitted",
      review: "15 Approved 40 pending",
    },
    {
      id: 4,

      document: "Jamb Admission letter",
      date: "Feb 14th, 2025",
      submission: "110/150 Submitted",
      review: "90 Approved 20 pending",
    },
    {
      id: 5,
      document: "Medical Report",
      date: "Feb 18th, 2025",
      submission: "145/150 Submitted",
      review: "80 Approved 65 pending ",
    },
    {
      id: 6,
      document: "Clearance Form",
      date: "Feb 18th, 2025",
      submission: "87/150 Submitted",
      review: "47 Approved 40 pending",
    },
    {
      id: 7,

      document: "Bank receipt ",
      date: "Feb 18th, 2025",
      submission: "65/150 Submitted",
      review: "25 Approved 40 pending",
    },
  ];

  // Function to handle edit click
  const handleEditClick = (deadline) => {
    setselectedDeadline(deadline);
    setEditModalIsOpen(true);
  };
  const handleDeleteClick = () => {
    // setselectedDeadline(announcement);
    setDeleteModalIsOpen(true);
  };
  const columns = [
    { name: "Document Type", selector: (row) => row.document, sortable: true },
    { name: "Due Date", selector: (row) => row.date, sortable: true },
    {
      name: "Submission status",
      selector: (row) => row.submission,
      sortable: true,
    },

    {
      name: "Review status",
      selector: (row) => row.review,
      sortable: true,
    },
    {
      name: "Action",
      selector: (row) => (
        <div className="flex">
          <button
            className="text-blue-500 hover:text-blue-700 flex items-center"
            onClick={() => handleEditClick(row)}
          >
            <IoEyeSharp className="mr-1" /> View
          </button>
          <button
            className="ml-2 text-red-500 hover:text-red-700 flex items-center"
            onClick={() => handleDeleteClick(row)}
          >
            <FaRegBell className="mr-1" /> Reminder
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-[#0D0637] mb-4">New Deadlines</h2>

      {/* Add New Deadline Button */}
      <button
        onClick={() => setModalIsOpen(true)}
        className="bg-[#C3A135] text-white px-4 py-2 rounded-md"
      >
        + New Deadline
      </button>

      <NewDeadlineForm
        isOpen={modalIsOpen}
        onClose={() => setModalIsOpen(false)}
      />

      {/* Deadlines Table */}
      <DataTable
        columns={columns}
        data={deadlines}
        pagination
        LowlightOnHover
        striped
      />
      {/* Edit Modal */}
      <WAECModal
        isOpen={editModalIsOpen}
        onClose={() => setEditModalIsOpen(false)}
        deadline={selectedDeadline}
      />
      <DeleteModal
        isOpen={deleteModalIsOpen}
        onClose={() => setDeleteModalIsOpen(false)}
      />
      <ViewModal
        isOpen={viewModalIsOpen}
        onClose={() => setViewModalIsOpen(false)}
        student={selectedStudent}
      />
      <ReviewModal
        isOpen={reviewModalIsOpen}
        onClose={() => setReviewModalIsOpen(false)}
        student={selectedStudent}
      />
      <ReminderModal
        isOpen={reminderModalIsOpen}
        onClose={() => setReminderModalIsOpen(false)}
        student={selectedStudent}
      />
    </div>
  );
};

export default Deadlines;
