import React from "react";
import Modal from "react-modal";

Modal.setAppElement("#root");

const DeleteModal = ({ isOpen, onClose, announcement }) => {
  const handleDelete = () => {
    // Here you would implement the actual deletion logic
    console.log("Deleting announcement:", announcement);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Delete Announcement"
      className="bg-white p-6 rounded-lg shadow-lg w-[20rem] md:w-[30rem] mx-auto"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
    >
      <h2 className="text-2xl font-bold text-[#0D0637] mb-4">
        Delete Announcement
      </h2>
      
      {announcement && (
        <div className="mb-6">
          <p>Are you sure you want to delete this announcement?</p>
          <p className="mt-2 font-medium text-gray-700">"{announcement.title}"</p>
        </div>
      )}

      {/* Buttons */}
      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          type="button"
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Delete Announcement
        </button>
      </div>
    </Modal>
  );
};

export default DeleteModal;