import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';

const Navbar = ({ role, userName, appId }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  // Debug: Log the props received by Navbar
  useEffect(() => {
    console.log("Navbar Props:", { role, userName, appId });
  }, [role, userName, appId]);
  
  const handleLogout = () => {
    logout();
    navigate('/'); // Redirect to home page after logout
  };

  return (
    <nav className="w-full bg-white text-white shadow-md z-40 lg:ml-64 transition-all duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-6 py-4">
        {/* User Info */}
        <p className="lg:text-md text-sm text-black font-textFont2">
          {userName || "User"} (<span className="font-medium font-textFont2">{role || "Guest"}</span>
          )
        </p>

        <div className="user-info flex items-center gap-4 w-full md:w-auto justify-end mt-2 md:mt-0">
          <div>
            <p className="text-black text-sm lg:text-md font-medium">
              {appId || "ID Not Available"}
            </p>
          </div>
          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            className="bg-[#C3A135] hover:bg-[#8d7527] text-white px-4 py-2 rounded-md text-sm font-semibold font-textFont2"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;