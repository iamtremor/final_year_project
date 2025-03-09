import React from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';

const Layout = ({ role }) => {
  const { user, logout } = useAuth();
  
  // Get the user's name from the auth context
  const userName = user ? user.fullName : 'User';
  
  // Get the appropriate ID based on user role
  let appId = '';
  if (user) {
    if (user.role === 'student') {
      appId = user.applicationId;
    } else if (user.role === 'staff') {
      appId = user.staffId;
    } else if (user.role === 'admin') {
      appId = user.adminId;
    }
  }

  return (
    <div className="layout-content">
      <Navbar role={role} userName={userName} appId={appId} />
      <div className="layout-content">
        <Sidebar role={role} />
        <div className="page-content ml-[80px] lg:ml-[15.5rem] my-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;