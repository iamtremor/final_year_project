import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import DataTable from "react-data-table-component";
import { IoEyeSharp } from "react-icons/io5";
import { FaRegBell } from "react-icons/fa";
import ViewModal from "./ViewModal";
import ReviewModal from "./ReviewModal";
import ReminderModal from "./ReminderModal";

Modal.setAppElement("#root");

const DocumentModal = ({ isOpen, onClose, deadline }) => {
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

  const students = [
    {
      id: 1,
      student: "Susu Mimi",
      document: "O' Level Result",
      date: "Jan 10, 2025",
      reviewedby: "Mr Femi",
      review: "Declined",
    },
    {
      id: 2,
      student: "Oghene Fathia",
      document: "Birth Certificate",
      date: "Jan 5, 2025",
      reviewedby: "Mrs Yemi",
      review: "Approved",
    },
    {
      id: 3,
      student: "Adeyemi Tayo",
      document: "Passport",
      date: "Dec 25, 2024",
      reviewedby: "Dr. Timothy",
      review: "Approved",
    },
    {
      id: 4,
      student: "Marvy Suli",
      document: "Jamb Admission letter",
      date: "Feb 14th, 2025",
      reviewedby: "Miss Nimi",
      review: "Pending",
    },
    {
      id: 5,
      student: "Temi Kazeem",
      document: "Medical Report",
      date: "Feb 18th, 2025",
      reviewedby: "Prof. Agu",
      review: "Declined",
    },
  ];

  const columns = [
    {
      name: "Student Name",
      selector: (row) => <div className=" font-semibold"> {row.student}</div>,
      sortable: true,
    },
    { name: "Submitted On", selector: (row) => row.date, sortable: true },
    { name: "Reviewed By", selector: (row) => row.reviewedby, sortable: true },
    {
      name: "Action",
      selector: (row) => (
        <div className="flex">
          {row.review === "Approved" && (
            <button
              className="text-blue-500 hover:text-blue-700 flex items-center"
              onClick={() => handleViewClick(row)}
            >
              <IoEyeSharp className="mr-1" /> View
            </button>
          )}
          {row.review === "Pending" && (
            <button
              className="text-yellow-500 hover:text-yellow-700 flex items-center"
              onClick={() => handleReminderClick(row)}
            >
              <FaRegBell className="mr-1" /> Send Reminder
            </button>
          )}
          {row.review === "Declined" && (
            <button
              className="text-red-500 hover:text-red-700 flex items-center"
              onClick={() => handleReviewClick(row)}
            >
              <IoEyeSharp className="mr-1" /> Review
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Document Modal"
      className="bg-white p-6 rounded-lg shadow-lg w-[20rem] md:w-[40rem] mx-auto"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
    >
      <h2 className="text-2xl font-bold text-[#0D0637] mb-4">
        {deadline?.document || "Document Type"}
      </h2>

      <DataTable
        columns={columns}
        data={students}
        pagination
        highlightOnHover
        striped
      />

      {/* View, Review, and Reminder Modals */}
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
    </Modal>
  );
};

export default DocumentModal;
