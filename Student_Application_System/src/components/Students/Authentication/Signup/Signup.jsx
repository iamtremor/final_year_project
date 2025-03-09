import { Link, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useState } from "react";
import Login_Image from "../../../../assets/blockchain.avif";
import { GiPadlock } from "react-icons/gi";
import { FaRegUser } from "react-icons/fa6";
import { FaArrowLeft } from "react-icons/fa";
import { HiOutlineIdentification } from "react-icons/hi2";
import { MdOutlineEmail } from "react-icons/md";
import { useForm } from "react-hook-form";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../../../../context/AuthContext";

const Signup = () => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const { register: registerUser } = useAuth(); // Using the register function from auth context
  
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      
      // Call the register function from auth context
      await registerUser({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        applicationId: data.applicationId
      }, 'student');
      
      toast.success("Registration successful!");
      navigate("/student/dashboard");
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(
        error.response?.data?.message || 
        "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Toaster position="top-right" />
      <Link to="/">
        <FaArrowLeft className="w-[1.5rem] h-[1.5rem] mt-[4rem] mx-[3rem] lg:mx-[7rem]" />
      </Link>
      <h1 className="text-center font-textFont2 text-[20px] lg:text-[25px] font-semibold">
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
            Student Register
          </h1>
          <form className="m-[3rem]" onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-[50px] md:mb-[41px] text-[12.34px] md:text-[17px] relative">
              <input
                className="border-[0.23px] md:border-[1px] w-full h-[50px] rounded-md text-sm border-black pl-[2.5rem] placeholder-black"
                type="text"
                placeholder="Full Name"
                {...register("fullName", {
                  required: "Full name is required"
                })}
              />
              <span className="absolute left-[1rem] top-[1.5rem] transform -translate-y-1/2 cursor-pointer text-gray-500">
                <FaRegUser className="w-[0.8rem]" />
              </span>
              {errors.fullName && (
                <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>
              )}
            </div>
            
            <div className="mb-[50px] md:mb-[41px] text-[12.34px] md:text-[17px] relative">
              <input
                className="border-[0.23px] md:border-[1px] w-full h-[50px] rounded-md text-sm border-black pl-[2.5rem] placeholder-black"
                type="email"
                placeholder="Email Address"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                    message: "Invalid email format"
                  }
                })}
              />
              <span className="absolute left-[1rem] top-[1.5rem] transform -translate-y-1/2 cursor-pointer text-gray-500">
                <MdOutlineEmail className="w-[1rem]" />
              </span>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>
            
            <div className="mb-[50px] md:mb-[41px] text-[12.34px] md:text-[17px] relative">
              <input
                className="border-[0.23px] md:border-[1px] w-full h-[50px] rounded-md text-sm border-black pl-[2.5rem] placeholder-black"
                type="text"
                placeholder="Application ID"
                {...register("applicationId", {
                  required: "Application ID is required"
                })}
              />
              <span className="absolute left-[1rem] top-[1.5rem] transform -translate-y-1/2 cursor-pointer text-gray-500">
                <HiOutlineIdentification className="w-[1rem]" />
              </span>
              {errors.applicationId && (
                <p className="text-red-500 text-xs mt-1">{errors.applicationId.message}</p>
              )}
            </div>

            <div className="mb-[50px] md:mb-[41px] text-[12.34px] md:text-[17px] relative">
              <input
                className="border-[0.23px] md:border-[1px] w-full h-[50px] rounded-md text-sm border-black pl-[2.5rem] placeholder-black"
                type={isPasswordVisible ? "text" : "password"}
                placeholder="Password"
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters"
                  }
                })}
              />
              <span className="absolute left-[1rem] top-[1.5rem] transform -translate-y-1/2 cursor-pointer text-gray-500">
                <GiPadlock className="w-[1rem]" />
              </span>
              <span
                className="absolute right-4 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500"
                onClick={togglePasswordVisibility}
              >
                {isPasswordVisible ? <FiEyeOff /> : <FiEye />}
              </span>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              className="bg-[#110c35] w-full h-[50px] rounded-md text-white flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                "Register"
              )}
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