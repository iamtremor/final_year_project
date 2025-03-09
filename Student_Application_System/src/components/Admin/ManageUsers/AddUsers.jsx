import React, { useState } from "react";
import Modal from "react-modal";

Modal.setAppElement("#root");

const AddUsers = ({ modalIsOpen, setModalIsOpen, users, setUsers }) => {
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    status: "",
    role: "",
    dateAdded: "",
  });

  const handleAddUser = () => {
    setUsers([...users, { ...newUser, id: users.length + 1 }]);
    setModalIsOpen(false);
    setNewUser({
      name: "",
      email: "",
      status: "",
      role: "",
      dateAdded: "",
    });
  };

  return (
    <Modal
      isOpen={modalIsOpen}
      onRequestClose={() => setModalIsOpen(false)}
      contentLabel="Add User"
      className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
    >
      <h2 className="text-lg font-medium mb-4 font-textFont2">Add New User</h2>
      <form>
        <div className="space-y-2">
          <label htmlFor="name" className="text-[13px]">
            Full Name:
          </label>
          <input
            type="text"
            placeholder="John Doe"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            className="border p-2 w-full rounded-md placeholder:text-[13px] text-"
          />
          <label htmlFor="email" className="text-[13px]">
            Email Address:
          </label>
          <input
            type="email"
            placeholder="Email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            className="border p-2 w-full rounded-md placeholder:text-[13px]"
          />
          <label htmlFor="email" className="text-[13px]">
            Status:
          </label>
          <input
            type="text"
            placeholder="Status (Active, Inactive, Pending)"
            value={newUser.status}
            onChange={(e) => setNewUser({ ...newUser, status: e.target.value })}
            className="border p-2 w-full rounded-md placeholder:text-[13px]"
          />
          <label htmlFor="email" className="text-[13px]">
            Role:
          </label>
          <input
            type="text"
            placeholder="Status (Admin, Staff, etc.)"
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            className="border p-2 w-full rounded-md placeholder:text-[13px]"
          />
          <label htmlFor="email" className="text-[13px]">
            Date Added:
          </label>
          <input
            type="date"
            placeholder="Date Added (e.g., 01 Jan 2025)"
            value={newUser.dateAdded}
            onChange={(e) =>
              setNewUser({ ...newUser, dateAdded: e.target.value })
            }
            className="border p-2 w-full rounded-md placeholder:text-[13px]"
          />
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={() => setModalIsOpen(false)}
            className="px-7 py-1 text-[13px] bg-red-600 rounded-md  mr-auto"
          >
            Cancel
          </button>
          <button
            onClick={handleAddUser}
            className="px-5 text-[13px] py-2 bg-blue-600 text-white rounded-md"
          >
            Add User
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddUsers;
