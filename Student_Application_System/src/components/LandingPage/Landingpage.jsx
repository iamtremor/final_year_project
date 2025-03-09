import React from "react";
import { useNavigate } from "react-router-dom";
import { PiStudent } from "react-icons/pi";
import { GoBriefcase } from "react-icons/go";
import { MdOutlineBadge } from "react-icons/md";

const Landingpage = () => {
  const navigate = useNavigate();

  const handleRoleSelection = (role) => {
    if (role === "student") navigate("/student/login");
    else if (role === "staff") navigate("/staff/login");
    else if (role === "admin") navigate("/admin/login");
  };

  return (
    <div className="role-selection mt-[100px] text-center textFont2 ">
      <h1 className="text-[24px] font-semibold leading-[3rem]">
        Welcome! Please Select Your Role
      </h1>
      <p className="font-medium mt-[1rem] lg:text-[20px]">
        Choose your role to proceed to the appropriate login page.
      </p>

      <div className="mt-[3rem] lg:mt-[7rem] flex justify-center gap-[10vw]">
        <button
          onClick={() => handleRoleSelection("student")}
          className="p-12 w-[260px] md:w-[250px] mb-[3rem] lg-mb:0 transform hover:scale-105 hover:shadow-md text-white hover:shadow-black bg-[#25408b] shadow-md shadow-[#d2d2d2] rounded-md cursor-pointer"
        >
          <PiStudent className="w-[4rem] h-[4rem] mx-auto" />
          <p className="mt-4">Upload and Track your Documents</p>
        </button>
        <button
          onClick={() => handleRoleSelection("staff")}
          className="p-12 w-[260px] md:w-[250px] transform mb-[3rem] lg-mb:0 hover:scale-105 hover:shadow-md hover:shadow-black bg-[#f6f6f6] shadow-md shadow-[#d2d2d2] rounded-md cursor-pointer"
        >
          <GoBriefcase className="w-[4rem] h-[4rem] mx-auto" />
          <p className="mt-4"> Review and Approve Documents</p>
        </button>
        <button
          onClick={() => handleRoleSelection("admin")}
          className="p-12 w-[260px] md:w-[250px] mb-[3rem] lg-mb:0 transform hover:scale-105 hover:shadow-md hover:shadow-black  bg-[#C3A135]  shadow-md shadow-[#d2d2d2] rounded-md cursor-pointer"
        >
          <MdOutlineBadge className="w-[4rem] h-[4rem] mx-auto" />
          <p className="mt-4">Manage Users and Monitor the System</p>
        </button>
      </div>
    </div>
  );
};

export default Landingpage;
