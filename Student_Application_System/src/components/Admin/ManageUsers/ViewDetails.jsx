import React from "react";
import Modal from "react-modal";

Modal.setAppElement("#root"); // For accessibility

const ViewDetails = ({ isOpen, onClose, user }) => {
  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="User Details"
      className="bg-white p-6 rounded-lg shadow-lg lg:w-[30rem] mx-auto"
      overlayClassName="fixed  inset-0 bg-black bg-opacity-50 flex justify-center items-center"
    >
      {/* <h2 className="text-lg font-medium mb-4 text-center ">User Details</h2> */}
      <div className="space-y-2">
        <p className="text-lg leading-3 font-medium font-textFont2">
          {user.name}
        </p>
        <p className="text-[13px] text-gray-500">{user.email}</p>
        <div className="flex border p-2 rounded-md items-center text-[13px]">
          <h1>Name</h1>
          <div className="border mx-4 ml-auto rounded-md p-2">
            <p>{user.name}</p>
          </div>
        </div>
        <div className="flex border p-2 rounded-md items-center text-[13px]">
          <h1>Email</h1>
          <div className="border mx-4 ml-auto rounded-md p-2">
            <p>{user.email}</p>
          </div>
        </div>
        <div className="flex border p-2 rounded-md items-center text-[13px]">
          <h1 className="font-semibold">Status</h1>
          <div
            className={`border mx-4 ml-auto rounded-md p-2 text-white ${
              user.status === "Active" ? "bg-green-500" : "bg-red-500"
            }`}
          >
            <p>{user.status}</p>
          </div>
        </div>
        <div className="flex border p-2 rounded-md items-center text-[13px]">
          <h1>Role</h1>
          <div className="border mx-4 ml-auto rounded-md p-2">
            <p>{user.role}</p>
          </div>
        </div>
        <div className="flex border p-2 rounded-md items-center text-[13px]">
          <h1>Date Added</h1>
          <div className="border mx-4 ml-auto rounded-md p-2">
            <p>{user.dateAdded}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <button
          onClick={onClose}
          className="px-7 py-2 bg-[#C3A135] text-[13px] text-white rounded-md"
        >
          Close
        </button>
      </div>
    </Modal>
  );
};

export default ViewDetails;
