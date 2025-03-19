import React, { useState } from "react";
import Logo from "../../assets/logo.png";
import { Link, useLocation } from "react-router-dom";
import { AiOutlineCloudUpload } from "react-icons/ai";
import { IoMdNotificationsOutline } from "react-icons/io";
import { HiOutlineDocumentSearch, HiOutlineClock } from "react-icons/hi";
import { FaUsers, FaTasks, FaRegTimesCircle } from "react-icons/fa";
import { FiFileText, FiCheckCircle, FiClock, FiXCircle, FiChevronDown } from "react-icons/fi";
import { MdOutlineSpaceDashboard, MdOutlineCampaign } from "react-icons/md";
import { CiSettings } from "react-icons/ci";
import { IoBarChart } from "react-icons/io5";
import { MdMenu, MdClose } from "react-icons/md";

const Sidebar = ({ role }) => {
  const location = useLocation();
  const activeLink = location.pathname;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openSubMenu, setOpenSubMenu] = useState(null);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleSubMenu = (index) =>
    setOpenSubMenu(openSubMenu === index ? null : index);

  const sidebarLinks = {
    Student: [
      {
        path: "/student/dashboard",
        name: "Dashboard",
        icon: MdOutlineSpaceDashboard,
      },
      {
        name: "Forms",
        icon: FiFileText, // Using the existing FileText icon
        subLinks: [
          { path: "/student/forms/new-clearance", name: "New Clearance Form", icon: FiFileText},
          { path: "/student/forms/prov-admission", name: "Provisional Admission" , icon: FiFileText},
          { path: "/student/forms/personal-record", name: "Personal Record" , icon: FiFileText},
          { path: "/student/forms/personal-record2", name: "Personal Record 2" , icon: FiFileText},
          { path: "/student/forms/affidavit", name: "Rules & Affidavit" , icon: FiFileText},
          { path: "/student/forms/form-status", name: "Forms Status", icon: HiOutlineDocumentSearch }
        ]
      },
      { path: "/student/my-documents", name: "My Documents", icon: FiFileText },
      {
        path: "/student/approved",
        name: "Approved Documents",
        icon: FiCheckCircle,
      },
      { path: "/student/pending", name: "Pending Documents", icon: FiClock },
      {
        path: "/student/upload",
        name: "Upload Documents",
        icon: AiOutlineCloudUpload,
      },
      {
        path: "/student/track",
        name: "Track Document Status",
        icon: HiOutlineDocumentSearch,
      },
      {
        path: "/student/notifications",
        name: "Notifications",
        icon: IoMdNotificationsOutline,
      },
      { path: "/student/profile", name: "Profile", icon: FaUsers },
    ],
    Staff: [
      {
        path: "/staff/dashboard",
        name: "Dashboard",
        icon: MdOutlineSpaceDashboard,
      },
      {
        path: "/staff/pending-approvals",
        name: "Pending Approvals",
        icon: FaTasks,
      },
      {
        path: "/staff/approved",
        name: "Approved Items",
        icon: FiCheckCircle,
      },
      {
        path: "/staff/rejected",
        name: "Rejected Items",
        icon: FiXCircle,
      },
      {
        path: "/staff/notifications",
        name: "Notifications",
        icon: IoMdNotificationsOutline,
      },
      { path: "/staff/profile", name: "Profile", icon: FaUsers },
    ],
    Admin: [
      {
        path: "/admin/dashboard",
        name: "Dashboard",
        icon: MdOutlineSpaceDashboard,
      },
      {
        path: "/admin/my-documents",
        name: "All Documents",
        icon: FiFileText,
        subLinks: [
          {
            path: "/admin/my-documents/approved",
            name: "Approved Documents",
            icon: FiCheckCircle,
          },
          {
            path: "/admin/my-documents/rejected",
            name: "Rejected Documents",
            icon: FaRegTimesCircle,
          },
        ],
      },
      {
        name: "Manage Users",
        icon: FaUsers,
        subLinks: [
          { name: "User List", path: "/admin/manage-user-user-list" },

          {
            path: "/admin/manage-user-roles-permission",
            name: "Roles and Permissions",
          },
        ],
      },

      {
        path: "/admin/announcement",
        name: "Announcement",
        icon: MdOutlineCampaign,
        subLinks: [{ path: "/admin/announcement", name: "New Announcement" }],
      },
      {
        path: "/admin/notifications",
        name: "Notifications",
        icon: IoMdNotificationsOutline,
      },
      {
        path: "/admin/deadlines",
        name: "Set Deadlines",
        icon: HiOutlineClock,
        subLinks: [
          {
            name: "Submission Deadlines",
            path: "/admin/deadlines",
          },
        ],
      },
      {
        path: "/admin/track-application",
        name: "Track Application",
        icon: HiOutlineDocumentSearch,
      },
      {
        path: "/admin/reports-analytics",
        name: "Reports and Analytics",
        icon: IoBarChart,
      },
      { path: "/admin/settings", name: "Settings", icon: CiSettings },
    ],
  };

  return (
    <>
      {/* Mobile Toggle Button - moved closer to edge and lower */}
      <button 
        className="fixed top-3 left-2 z-50 lg:hidden bg-blue-900 text-white p-1.5 rounded-md"
        onClick={toggleSidebar}
      >
        {sidebarOpen ? <MdClose size={20} /> : <MdMenu size={20} />}
      </button>

      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 h-full w-64 bg-[#1E3A8A] text-gray-300 transition-transform duration-300 z-40
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-400">
          <div className="flex items-center gap-3">
            <img src={Logo} alt="logo" className="w-12 h-12" />
            <h1 className="text-lg font-semibold">SAS</h1>
          </div>
        </div>

        {/* Sidebar Links - removed overflow-y-auto */}
        <div className="h-[calc(100vh-64px)]">
          <ul className="mt-6 px-4 space-y-3">
            {role &&
              sidebarLinks[role]?.map((item, index) => (
                <li key={item.path || index}>
                  {item.subLinks ? (
                    <>
                      {/* Parent Link */}
                      <button
                        className={`flex items-center justify-between w-full px-4 py-3 rounded-md text-[13px] font-normal
                        ${
                          openSubMenu === index
                            ? "bg-[#112969] text-white"
                            : "hover:bg-[#1c316c] hover:text-white"
                        }`}
                        onClick={() => toggleSubMenu(index)}
                      >
                        <div className="flex items-center gap-3">
                          {React.createElement(item.icon, { size: 20 })}
                          <span>{item.name}</span>
                        </div>
                        <FiChevronDown 
                          size={16} 
                          className={`transform transition-transform duration-200 ${openSubMenu === index ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {/* Submenu Links */}
                      {openSubMenu === index && (
                        <ul className="ml-6 mt-2 space-y-2">
                          {item.subLinks.map((sub) => (
                            <li key={sub.path}>
                              <Link
                                to={sub.path}
                                className={`block px-4 py-2 text-[12px] rounded-md ${
                                  activeLink === sub.path
                                    ? "bg-[#112969] text-white"
                                    : "hover:bg-[#1c316c] hover:text-white"
                                }`}
                              >
                                {sub.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <Link
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-3 rounded-md text-[13px] font-normal
                      ${
                        activeLink.startsWith(item.path)
                          ? "bg-[#112969] text-white"
                          : "hover:bg-[#1c316c] hover:text-white"
                      }`}
                    >
                      {React.createElement(item.icon, { size: 20 })}
                      <span>{item.name}</span>
                    </Link>
                  )}
                </li>
              ))}
          </ul>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
    </>
  );
};

export default Sidebar;