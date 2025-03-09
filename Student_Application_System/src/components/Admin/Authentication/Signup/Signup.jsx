import { Link, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useState } from "react";
import Login_Image from "../../../../assets/blockchain.avif";
import { useForm } from "react-hook-form";
import { GiPadlock } from "react-icons/gi";
import { FaRegUser } from "react-icons/fa6";
import { FaArrowLeft } from "react-icons/fa";
import { HiOutlineIdentification } from "react-icons/hi2";
import { MdOutlineEmail } from "react-icons/md";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

const Signup = () => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const { register, handleSubmit, formState } = useForm();
  const navigate = useNavigate();
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <div>
      <Link to="/">
        <FaArrowLeft className="w-[1.5rem] h-[1.5rem] mt-[4rem] mx-[3rem] lg:mx-[7rem]" />
      </Link>
      <h1 className="text-center font-textFont2  text-[20px] lg:text-[25px] font-semibold">
        Create your account
      </h1>
      <p className="text-center font-textFont2 text-[15px] lg:text-[20px] font-medium">
        Join us to streamline document approvals
      </p>
      <div className="lg:grid lg:grid-cols-2 mt-[10%] lg:mt-[2%] mx-[10%] rounded-md shadow-sm shadow-[#c5c5c5]">
        <div className="hidden lg:flex">
          <img
            src={Login_Image}
            alt="login_image"
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h1 className="text-center pt-[2rem] text-[#1E3A8A] font-bold text-[25px]">
            Admin Register
          </h1>
          <form className="m-[3rem]">
            <div className="mb-[50px] md:mb-[41px] text-[12.34px] md:text-[17px] relative">
              <input
                className="border-[0.23px] md:border-[1px] w-full h-[50px] rounded-md text-sm border-black  pl-[2.5rem] placeholder-black"
                type="text"
                placeholder="Full Name"
              />
              <span className=" absolute left-[1rem] top-[1.5rem] transform -translate-y-1/2 cursor-pointer text-gray-500">
                <FaRegUser className="w-[0.8rem]" />
              </span>
            </div>
            <div className="mb-[50px] md:mb-[41px] text-[12.34px] md:text-[17px] relative ">
              <input
                className="border-[0.23px] md:border-[1px] w-full h-[50px] rounded-md text-sm border-black  pl-[2.5rem] placeholder-black"
                type="email"
                placeholder="Email Address"
                {...register("email", {
                  required: {
                    value: true,
                    message: "Email is required",
                  },
                  pattern: {
                    value: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                    message: "Invalid email format",
                  },
                })}
              />
              <span className=" absolute left-[1rem] top-[1.5rem] transform -translate-y-1/2 cursor-pointer text-gray-500">
                <MdOutlineEmail className="w-[1rem]" />
              </span>
            </div>
            <div className="mb-[50px] md:mb-[41px] text-[12.34px] md:text-[17px] relative">
              <input
                className="border-[0.23px] md:border-[1px] w-full h-[50px] rounded-md text-sm border-black  pl-[2.5rem] placeholder-black"
                type="number"
                placeholder="Application ID"
              />
              <span className=" absolute left-[1rem] top-[1.5rem] transform -translate-y-1/2 cursor-pointer text-gray-500">
                <HiOutlineIdentification className="w-[1rem]" />
              </span>
            </div>

            <div className="mb-[50px] md:mb-[41px] text-[12.34px] md:text-[17px] relative">
              <input
                className="border-[0.23px] md:border-[1px] w-full h-[50px] rounded-md text-sm border-black  pl-[2.5rem] placeholder-black"
                type={isPasswordVisible ? "text" : "password"}
                placeholder="Password"
                {...register("password", {
                  required: {
                    value: true,
                    message: "Password is required",
                  },
                  pattern: {
                    value: /^[a-zA-Z0-9]{6,}$/,
                    message: "Invalid password format",
                  },
                })}
              />
              <span className=" absolute left-[1rem] top-[1.5rem] transform -translate-y-1/2 cursor-pointer text-gray-500">
                <GiPadlock className="w-[1rem]" />
              </span>
              <span
                className="absolute right-4 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500"
                onClick={togglePasswordVisibility}
              >
                {isPasswordVisible ? <FiEyeOff /> : <FiEye />}
              </span>
            </div>

            <button
              className="bg-[#110c35] w-full h-[50px] rounded-md text-white"
              onClick={() => navigate("/admin/dashboard")}
            >
              Register
            </button>
            <p className="text-center mt-8 pb-12 lg:pb-0">
              Already an account? {""}
              <Link to="/student/login" className="underline font-semibold">
                Login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
