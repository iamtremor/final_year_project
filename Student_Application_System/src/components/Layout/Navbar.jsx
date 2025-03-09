import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';

const Navbar = ({ role, userName, appId }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/'); // Redirect to home page after logout
  };

  return (
    <nav className="lg:ml-[15.7rem] ml-[80px] bg-[white] text-white shadow-md z-50">
      <div className="md:flex justify-between items-center px-6 py-4">
        {/* User Info */}
        <p className="lg:text-md text-sm text-black font-textFont2">
          {userName} (<span className="font-medium font-textFont2">{role}</span>
          )
        </p>

        <div className="user-info flex items-center gap-4 mt-2 md:mt-0">
          <div>
            <p className="text-black ml-auto text-sm lg:text-md font-medium">
              {appId}
            </p>
          </div>
          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            className="bg-[#C3A135] ml-auto flex font-textFont2 mt-2 md:mt-0 hover:bg-[#8d7527] text-white px-4 py-2 rounded-md text-sm font-semibold"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;