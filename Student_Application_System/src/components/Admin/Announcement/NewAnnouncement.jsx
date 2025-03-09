import React, { useState } from "react";
import Modal from "react-modal";

Modal.setAppElement("#root");

const NewAnnouncementModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    title: "",
    audience: "Students",
    content: "",
    scheduleDate: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("New Announcement:", formData);
    onClose(); // Close modal after submission
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Create Announcement"
      className="bg-white p-6 rounded-lg shadow-lg w-[20rem] md:w-[40rem] mx-auto"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
    >
      <h2 className="text-2xl font-bold text-[#0D0637] mb-4">
        Create New Announcement
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-[#0D0637] font-semibold mb-2">
            Title
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter announcement title"
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>

        {/* Audience Selection */}
        <div>
          <label className="block text-[#0D0637] font-semibold mb-2">
            Audience
          </label>
          <select
            name="audience"
            value={formData.audience}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
          >
            <option value="Students">Students</option>
            <option value="Staff">Staff</option>
            <option value="Students & Staff">Students & Staff</option>
          </select>
        </div>

        {/* Content */}
        <div>
          <label className="block text-[#0D0637] font-semibold mb-2">
            Content
          </label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            placeholder="Enter the announcement details"
            className="w-full p-2 border border-gray-300 rounded h-32"
            required
          />
        </div>

        {/* Schedule Date */}
        <div>
          <label className="block text-[#0D0637] font-semibold mb-2">
            Schedule Date (Optional)
          </label>
          <input
            type="date"
            name="scheduleDate"
            value={formData.scheduleDate}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-between mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-red-600 text-white rounded-md"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-[#C3A135] text-white px-4 py-2 rounded hover:bg-[#a4862a]"
          >
            Post Announcement
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default NewAnnouncementModal;
