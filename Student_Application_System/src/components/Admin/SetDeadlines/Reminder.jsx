import React, { useState, useEffect } from "react";
import Modal from "react-modal";

Modal.setAppElement("#root");

const DeleteModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    title: "",
    audience: "Students",
    content: "",
    scheduleDate: "",
  });

  // Populate form fields when announcement changes
  //   useEffect(() => {
  //     if (announcement) {
  //       setFormData({
  //         title: announcement.title || "",
  //         audience: announcement.audience || "Students",
  //         content: announcement.content || "",
  //         scheduleDate: announcement.date || "",
  //       });
  //     }
  //   }, [announcement]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Updated Announcement:", formData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Edit Announcement"
      className="bg-white p-6 rounded-lg shadow-lg w-[20rem] md:w-[30rem] mx-auto"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
    >
      <h2 className="text-2xl font-bold text-[#0D0637] mb-4">Send Reminder</h2>
      <p>Are you sure you want to send a reminder?</p>

      {/* Buttons */}
      <div className="flex justify-between mt-12">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-red-600 text-white rounded-md"
        >
          Cancel
        </button>
        <button
          onClick={onClose}
          type="submit"
          className="bg-[#C3A135] text-white px-4 py-2 rounded hover:bg-[#a4862a]"
        >
          Send Reminder
        </button>
      </div>
    </Modal>
  );
};

export default DeleteModal;
