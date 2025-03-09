import React, { useState } from "react";
import DataTable from "react-data-table-component";
import Modal from "react-modal";
import { FaUserPlus } from "react-icons/fa";
import AddUsers from "./AddUsers";
import ViewDetails from "./ViewDetails";

Modal.setAppElement("#root"); // For accessibility

const UserList = () => {
  const [users, setUsers] = useState([
    {
      id: 1,
      name: "Angela Smith",
      email: "aasmith@admin.babcock.edu.ng",
      status: "Active",
      role: "Administrator ",
      dateAdded: "07 Jun 2023",
    },
    {
      id: 2,
      name: "David Osahon",
      email: "arlenemccoy@admin.babcock.edu.ng",
      status: "Active",
      role: "Administrator ",
      dateAdded: "24 Jan 2022",
    },
    {
      id: 3,
      name: "Sharon Nonso",
      email: "sharzzy@admin.babcock.edu.ng",
      status: "Inactive",
      role: "Contributor",
      dateAdded: "18 Apr 2020",
    },
    {
      id: 4,
      name: "Dianne Russell",
      email: "dianne@admin.babcock.edu.ng",
      status: "Active",
      role: "Contributor",
      dateAdded: "02 Feb 2022",
    },
    {
      id: 5,
      name: "Kazeem Temz",
      email: "temzz_k@admin.babcock.edu.ng",
      status: "Inactive",
      role: "Administrator ",
      dateAdded: "29 Jun 2022",
    },
  ]);

  const [search, setSearch] = useState("");
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const handleSearch = (e) => setSearch(e.target.value);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  );
  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setViewModalOpen(true);
  };
  const columns = [
    { name: "Name", selector: (row) => row.name, sortable: true },
    { name: "Email", selector: (row) => row.email, sortable: true },
    {
      name: "Status",
      selector: (row) => (
        <div
          className={`${
            row.status === "Active"
              ? "text-green-600 "
              : row.status === "Inactive"
              ? "text-red-600 "
              : "text-gray-600 "
          } font-semibold `}
        >
          {row.status}
        </div>
      ),
      sortable: true,
    },
    {
      name: "Role",
      selector: (row) => (
        <div
          className={`${
            row.role === "Administrator "
              ? "text-teal-700 bg-teal-200"
              : row.role === "Contributor"
              ? "text-gray-400 bg-gray-200 "
              : "text-blue-600 "
          } font-semibold  border-dotted border-2 border-gray-300 rounded-lg py-[2px] px-2 text-[12px]`}
        >
          {row.role}
        </div>
      ),
      sortable: true,
    },
    // { name: "Role", selector: (row) => row.role, sortable: true },
    { name: "Date Added", selector: (row) => row.dateAdded, sortable: true },

    {
      name: "Actions",
      cell: (row) => (
        <button
          onClick={() => handleViewDetails(row)}
          className="text-blue-600 hover:underline"
        >
          View Profile
        </button>
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-100 h-screen">
      <h2 className="text-xl font-bold mb-4 font-textFont2">User List</h2>

      <div className="flex justify-between items-center mb-4">
        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={handleSearch}
          className="border p-2 placeholder:text-[13px] rounded-md w-1/3"
        />

        {/* Add User Button */}
        <button
          onClick={() => setModalIsOpen(true)}
          className="bg-blue-600 text-white text-[12px] px-4 py-2 rounded-md flex items-center gap-2"
        >
          <FaUserPlus /> Add User
        </button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredUsers}
        pagination
        highlightOnHover
        striped
      />

      {/* Add User Modal */}
      <AddUsers
        modalIsOpen={modalIsOpen}
        setModalIsOpen={setModalIsOpen}
        users={users}
        setUsers={setUsers}
      />
      {/* View User Details Modal */}
      <ViewDetails
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        user={selectedUser}
      />
    </div>
  );
};

export default UserList;
