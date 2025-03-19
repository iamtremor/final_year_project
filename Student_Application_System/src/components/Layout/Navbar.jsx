import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';

const Navbar = ({ role, userName, appId }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-md h-16">
      <div className="container h-full max-w-full mx-auto flex justify-between items-center px-4 lg:px-6">
        {/* Left side - User Info */}
        <div className="flex items-center">
          {/* Space for mobile menu button */}
          <div className="w-8 lg:hidden"></div>
          <div className="text-black">
            <p className="text-sm font-medium">
              {userName || "User"} <span className="text-gray-600 font-normal">({role || "Guest"})</span>
            </p>
          </div>
        </div>
        
        {/* Right side - Application ID and Logout */}
        <div className="flex items-center gap-3">
          <div className="bg-gray-100 px-3 py-1.5 rounded-md">
            <p className="text-black text-sm font-medium truncate max-w-[150px]">
              {appId || "ID Not Available"}
            </p>
          </div>
          <button 
            onClick={handleLogout}
            className="bg-[#C3A135] hover:bg-[#8d7527] text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;