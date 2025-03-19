import React from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';

const Layout = ({ role }) => {
  const { user } = useAuth();
  
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
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar role={role} />
      
      {/* Main Content */}
      <div className="flex flex-col flex-1 lg:ml-64 w-full overflow-hidden">
        {/* Navbar */}
        <Navbar 
          role={role} 
          userName={userName} 
          appId={appId} 
        />
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;