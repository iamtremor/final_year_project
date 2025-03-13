import { Link, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff, FiPhone, FiCalendar } from "react-icons/fi";
import { useState } from "react";
import { GiPadlock } from "react-icons/gi";
import { FaRegUser, FaArrowLeft, FaChevronRight, FaGraduationCap } from "react-icons/fa";
import { HiOutlineIdentification, HiOutlineAcademicCap } from "react-icons/hi2";
import { MdOutlineEmail } from "react-icons/md";
import { useForm } from "react-hook-form";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../../../../context/AuthContext";

const Signup = () => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const { register: registerUser } = useAuth(); // Using the register function from auth context
  
  // For password confirmation validation
  const password = watch("password", "");
  
  // Department options
  const departments = [
    "Computer Science",
    "Software Engineering",
    "Information Technology",
    "Computer Information Science",
    "Computer Technology"
  ];
  
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const toggleConfirmPasswordVisibility = () => {
    setIsConfirmPasswordVisible(!isConfirmPasswordVisible);
  };

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      
      // Format date to ISO string for backend
      const formattedData = {
        ...data,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : null
      };
      
      // Call the register function from auth context
      await registerUser(formattedData, 'student');
      
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
    <div className="p-6 bg-gray-50 min-h-screen">
      <Toaster position="top-right" />
      
      {/* Header with back button */}
      <div className="mb-4">
        <Link to="/" className="inline-flex items-center text-gray-600 hover:text-[#1E3A8A] transition-colors">
          <FaArrowLeft className="w-4 h-4 mr-2" />
          <span>Back to Home</span>
        </Link>
      </div>
      
      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-[#1E3A8A] flex items-center justify-center">
            <FaGraduationCap className="mr-2 text-[#1E3A8A]" />
            Student Registration
          </h1>
          <p className="text-gray-600 mt-2">Join our secure blockchain-based enrollment system</p>
        </div>

        {/* Signup Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Create Your Account</h2>
            <p className="text-sm text-gray-500 mt-1">Please fill out all required fields</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name Field */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <FaRegUser />
                  </div>
                  <input
                    id="fullName"
                    type="text"
                    className={`pl-10 w-full h-11 border ${errors.fullName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-[#1E3A8A] focus:border-[#1E3A8A] shadow-sm`}
                    placeholder="Enter your full name"
                    {...register("fullName", {
                      required: "Full name is required"
                    })}
                  />
                </div>
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
                )}
              </div>
              
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <MdOutlineEmail />
                  </div>
                  <input
                    id="email"
                    type="email"
                    className={`pl-10 w-full h-11 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-[#1E3A8A] focus:border-[#1E3A8A] shadow-sm`}
                    placeholder="Enter your email address"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                        message: "Invalid email format"
                      }
                    })}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Phone Number Field */}
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <FiPhone />
                  </div>
                  <input
                    id="phoneNumber"
                    type="tel"
                    className={`pl-10 w-full h-11 border ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-[#1E3A8A] focus:border-[#1E3A8A] shadow-sm`}
                    placeholder="Enter your phone number"
                    {...register("phoneNumber", {
                      required: "Phone number is required",
                      pattern: {
                        value: /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
                        message: "Invalid phone number format"
                      }
                    })}
                  />
                </div>
                {errors.phoneNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.phoneNumber.message}</p>
                )}
              </div>

              {/* Date of Birth Field */}
              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <FiCalendar />
                  </div>
                  <input
                    id="dateOfBirth"
                    type="date"
                    className={`pl-10 w-full h-11 border ${errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-[#1E3A8A] focus:border-[#1E3A8A] shadow-sm`}
                    {...register("dateOfBirth", {
                      required: "Date of birth is required",
                      validate: value => {
                        const dob = new Date(value);
                        const today = new Date();
                        const age = today.getFullYear() - dob.getFullYear();
                        return age >= 16 || "You must be at least 16 years old";
                      }
                    })}
                  />
                </div>
                {errors.dateOfBirth && (
                  <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p>
                )}
              </div>

              {/* Department Field */}
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                  Department <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <HiOutlineAcademicCap />
                  </div>
                  <select
                    id="department"
                    className={`pl-10 w-full h-11 border ${errors.department ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-[#1E3A8A] focus:border-[#1E3A8A] shadow-sm bg-white`}
                    {...register("department", {
                      required: "Department is required"
                    })}
                  >
                    <option value="">Select your department</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                {errors.department && (
                  <p className="mt-1 text-sm text-red-600">{errors.department.message}</p>
                )}
              </div>
              
              {/* Application ID Field */}
              <div>
                <label htmlFor="applicationId" className="block text-sm font-medium text-gray-700 mb-1">
                  Application ID <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <HiOutlineIdentification />
                  </div>
                  <input
                    id="applicationId"
                    type="text"
                    className={`pl-10 w-full h-11 border ${errors.applicationId ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-[#1E3A8A] focus:border-[#1E3A8A] shadow-sm`}
                    placeholder="6-digit application ID"
                    {...register("applicationId", {
                      required: "Application ID is required",
                      pattern: {
                        value: /^\d{6}$/,
                        message: "Application ID must be a 6-digit number"
                      }
                    })}
                  />
                </div>
                {errors.applicationId && (
                  <p className="mt-1 text-sm text-red-600">{errors.applicationId.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <GiPadlock />
                  </div>
                  <input
                    id="password"
                    type={isPasswordVisible ? "text" : "password"}
                    className={`pl-10 w-full h-11 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-[#1E3A8A] focus:border-[#1E3A8A] shadow-sm`}
                    placeholder="Create a password"
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 8,
                        message: "Password must be at least 8 characters"
                      }
                    })}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                    onClick={togglePasswordVisibility}
                  >
                    {isPasswordVisible ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {errors.password ? (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters</p>
                )}
              </div>
              
              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <GiPadlock />
                  </div>
                  <input
                    id="confirmPassword"
                    type={isConfirmPasswordVisible ? "text" : "password"}
                    className={`pl-10 w-full h-11 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-[#1E3A8A] focus:border-[#1E3A8A] shadow-sm`}
                    placeholder="Confirm your password"
                    {...register("confirmPassword", {
                      required: "Please confirm your password",
                      validate: value => value === password || "Passwords do not match"
                    })}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                    onClick={toggleConfirmPasswordVisibility}
                  >
                    {isConfirmPasswordVisible ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-4">
                <Link to="/student/login" className="text-[#1E3A8A] hover:text-[#152a63] text-sm font-medium flex items-center justify-center sm:justify-start">
                  Already have an account? Log in
                  <FaChevronRight className="ml-1 text-xs" />
                </Link>
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto px-6 h-11 bg-[#1E3A8A] hover:bg-[#152a63] text-white rounded-md transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E3A8A]"
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
              </div>
            </div>
          </form>
        </div>

        {/* Security Note */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Your information is secured with blockchain technology
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;  