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
    <div className="flex flex-col min-h-screen">
      <Sidebar role={role} />
      <div className="flex flex-col flex-1">
        <Navbar role={role} userName={userName} appId={appId} />
        <main className="flex-1 transition-all duration-300 lg:ml-64 ml-0 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;