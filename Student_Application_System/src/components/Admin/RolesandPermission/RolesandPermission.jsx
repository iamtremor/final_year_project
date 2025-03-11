import React, { useState } from "react";
import DataTable from "react-data-table-component";
import { AiOutlineEdit, AiOutlineDelete, AiOutlinePlus } from "react-icons/ai";
import { MdSecurity } from "react-icons/md";

// Sample Roles & Permissions Data
const initialRoles = [
  {
    id: 1,
    roleName: "Student",
    permissions: ["Upload Documents", "Track Status", "View Notifications"],
  },
  {
    id: 2,
    roleName: "Staff",
    permissions: [
      "Approve Documents",
      "Reject Documents",
      "Send Notifications",
    ],
  },
  {
    id: 3,
    roleName: "Admin",
    permissions: [
      "Manage Users",
      "Assign Roles",
      "Approve & Reject Documents",
      "Post Announcements",
      "View Reports",
    ],
  },
];

const RolesPermissions = () => {
  const [roles, setRoles] = useState(initialRoles);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newPermissions, setNewPermissions] = useState([]); // Open modal to edit role permissions

  const handleEditRole = (role) => {
    setSelectedRole(role);
    setNewPermissions(role.permissions);
    setShowModal(true);
  }; // Save updated permissions

  const handleSavePermissions = () => {
    setRoles((prevRoles) =>
      prevRoles.map((role) =>
        role.id === selectedRole.id
          ? { ...role, permissions: newPermissions }
          : role
      )
    );
    setShowModal(false);
  }; // Handle permission checkbox toggle

  const handlePermissionToggle = (permission) => {
    setNewPermissions((prevPermissions) =>
      prevPermissions.includes(permission)
        ? prevPermissions.filter((p) => p !== permission)
        : [...prevPermissions, permission]
    );
  }; // Table Columns

  const columns = [
    {
      name: "Role Name",
      selector: (row) => row.roleName,
      sortable: true,
    },
    {
      name: "Assigned Permissions",
      cell: (row) => (
        <div className="text-sm text-gray-600">
          {row.permissions.join(", ")}
        </div>
      ),
      wrap: true,
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex">
          {/* Edit Role Button */}

          <button
            className="text-blue-500 hover:text-blue-700 flex items-center"
            onClick={() => handleEditRole(row)}
          >
            <AiOutlineEdit className="mr-1" /> Edit
          </button>
          {/* Delete Role Button */}

          <button
            className="text-red-500 hover:text-red-700 flex items-center"
            onClick={() => setRoles(roles.filter((role) => role.id !== row.id))}
          >
            <AiOutlineDelete className="mr1" /> Delete
          </button>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
  ]; // Available permissions for selection

  const allPermissions = [
    "Upload Documents",
    "Track Status",
    "View Notifications",
    "Approve Documents",
    "Reject Documents",
    "Send Notifications",
    "Manage Users",
    "Assign Roles",
    "Post Announcements",
    "View Reports",
  ];

  return (
    <div className="p-6">
      {/* Header */}

      <div className="flex items-center mb-4">
        <MdSecurity size={30} className="text-[#0D0637] mr-2" />

        <h2 className="text-2xl font-bold text-[#0D0637]">
          Roles & Permissions
        </h2>
      </div>
      {/* React Data Table */}

      <DataTable
        columns={columns}
        data={roles}
        pagination
        highlightOnHover
        responsive
        striped
        className="shadow-lg rounded-lg"
      />
      {/* Edit Role Modal */}

      {showModal && selectedRole && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-md shadow-lg max-w-lg w-full">
            <h3 className="text-lg font-bold mb-2">
              Edit Permissions for {selectedRole.roleName}
            </h3>
            {/* Permission List */}

            <div className="mt-4 space-y-2">
              {allPermissions.map((permission) => (
                <label key={permission} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newPermissions.includes(permission)}
                    onChange={() => handlePermissionToggle(permission)}
                  />
                  <span>{permission}</span>
                </label>
              ))}
            </div>
            {/* Modal Actions */}

            <div className="mt-4 flex justify-between">
              <button
                className="bg-gray-300 px-4 py-2 rounded-md"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>

              <button
                className="bg-[#C3A135] text-white px-4 py-2 rounded-md"
                onClick={handleSavePermissions}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesPermissions;
