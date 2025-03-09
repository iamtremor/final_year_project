import React from "react";
import { Link, useLocation } from "react-router-dom";
import { AiOutlineCloudUpload } from "react-icons/ai";
import { IoMdNotificationsOutline } from "react-icons/io";
import { HiOutlineDocumentSearch } from "react-icons/hi";
import { HiOutlineClock } from "react-icons/hi2";

import {
  FaUsers,
  FaTasks,
  FaUserShield,
  FaRegTimesCircle,
  FaFileAlt,
} from "react-icons/fa";
import { FiFileText, FiCheckCircle, FiClock } from "react-icons/fi";
import { MdOutlineSpaceDashboard, MdOutlineCampaign } from "react-icons/md";
import { CiSettings } from "react-icons/ci";
import { IoBarChart } from "react-icons/io5";

const Sidebar = ({ role }) => {
  const location = useLocation();
  const activeLink = location.pathname;

  // Function to check active link
  const isActive = (link) => activeLink.startsWith(link);

  // Function to render full sidebar links
  const renderLink = (link, text, Icon) => (
    <Link
      to={link}
      className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium ${
        isActive(link)
          ? "bg-[#112969] text-white"
          : "text-gray-300 hover:bg-[#1c316c] hover:text-white"
      }`}
    >
      <Icon size={20} />
      <span>{text}</span>
    </Link>
  );

  // Function to render compact sidebar links for small screens
  const renderLinkSmall = (link, Icon) => (
    <Link
      to={link}
      className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium ${
        isActive(link)
          ? "bg-[#112969] text-white"
          : "text-gray-300 hover:bg-[#1c316c] hover:text-white"
      }`}
    >
      <Icon size={20} />
    </Link>
  );

  // Sidebar links configuration
  const sidebarLinks = {
    Student: [
      {
        path: "/student/dashboard",
        name: "Dashboard",
        icon: MdOutlineSpaceDashboard,
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
        name: "Track Status",
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
        path: "/staff/approved",
        name: "Approved Documents",
        icon: FiCheckCircle,
      },
      {
        path: "/staff/pending-approvals",
        name: "Pending Approvals",
        icon: FaTasks,
      },
      {
        path: "/staff/documents",
        name: "All Documents",
        icon: FiFileText,
      },

      {
        path: "/staff/notifications",
        name: "Notifications",
        icon: IoMdNotificationsOutline,
      },
      { path: "/student/profile", name: "Profile", icon: FaUsers },
    ],
    Admin: [
      {
        path: "/admin/dashboard",
        name: "Dashboard",
        icon: MdOutlineSpaceDashboard,
      },
      { path: "/admin/manage-users", name: "Manage Users", icon: FaUsers },
      {
        path: "/admin/roles-permission",
        name: "Roles and Permissions",
        icon: FaUserShield,
      },
      { path: "/admin/my-documents", name: "All Documents", icon: FiFileText },

      {
        path: "/admin/approved",
        name: "Approved Documents",
        icon: FiCheckCircle,
      },
      {
        path: "/admin/rejected",
        name: "Rejected Documents",
        icon: FaRegTimesCircle,
      },
      {
        path: "/admin/announcement",
        name: "Announcement",
        icon: MdOutlineCampaign,
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
      {
        path: "/admin/settings",
        name: "Settings",
        icon: CiSettings,
      },
    ],
  };

  return (
    <div className="fixed top-0 left-0 h-full w-[90px] lg:w-[250px] bg-[#1E3A8A] text-gray-300">
      <h1 className="font-semibold lg:text-[26px] text-[#C3A135] mt-4 border-b-[0.2px] border-gray-400 text-center lg:text-left lg:px-[30px] py-[15px]">
        SEMS
      </h1>
      <div className="mt-6 px-4">
        {/* Large Screen Navigation */}
        <ul className="space-y-3 hidden lg:block">
          {role &&
            sidebarLinks[role]?.map(({ path, name, icon }) =>
              renderLink(path, name, icon)
            )}
        </ul>

        {/* Small Screen Navigation */}
        <ul className="space-y-3 lg:hidden block">
          {role &&
            sidebarLinks[role]?.map(({ path, icon }) =>
              renderLinkSmall(path, icon)
            )}
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
