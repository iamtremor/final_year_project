import { Link, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useState } from "react";
import { GiPadlock } from "react-icons/gi";
import { FaArrowLeft, FaChevronRight, FaUserTie } from "react-icons/fa";
import { HiOutlineIdentification } from "react-icons/hi2";
import { useForm } from "react-hook-form";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../../../../context/AuthContext";

const Login = () => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      
      // Call the login function from auth context
      await login({
        staffId: data.staffId,
        password: data.password
      }, 'staff');
      
      toast.success("Login successful!");
      navigate("/staff/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      toast.error(
        error.response?.data?.message || 
        "Login failed. Please check your credentials."
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
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-[#1E3A8A] flex items-center justify-center">
            <FaUserTie className="mr-2 text-[#1E3A8A]" />
            Staff Login
          </h1>
          <p className="text-gray-600 mt-2">Welcome back to the enrollment system</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Account Access</h2>
            <p className="text-sm text-gray-500 mt-1">Enter your credentials to log in</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6">
            <div className="space-y-6">
              {/* Staff ID Field */}
              <div>
                <label htmlFor="staffId" className="block text-sm font-medium text-gray-700 mb-1">
                  Staff ID <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <HiOutlineIdentification />
                  </div>
                  <input
                    id="staffId"
                    type="text"
                    className={`pl-10 w-full h-11 border ${errors.staffId ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-[#1E3A8A] focus:border-[#1E3A8A] shadow-sm`}
                    placeholder="Enter your staff ID"
                    {...register("staffId", {
                      required: "Staff ID is required"
                    })}
                  />
                </div>
                {errors.staffId && (
                  <p className="mt-1 text-sm text-red-600">{errors.staffId.message}</p>
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
                    placeholder="Enter your password"
                    {...register("password", {
                      required: "Password is required"
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
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end">
                <Link to="/staff/forgot-password" className="text-sm font-medium text-[#1E3A8A] hover:text-[#152a63]">
                  Forgot password?
                </Link>
              </div>
              
              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-[#1E3A8A] hover:bg-[#152a63] text-white rounded-md transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E3A8A]"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  "Login"
                )}
              </button>
            </div>
            
            {/* Register Link */}
            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-gray-600">
                Don't have an account?{" "}
                <Link to="/staff/signup" className="text-[#1E3A8A] hover:text-[#152a63] font-medium inline-flex items-center">
                  Sign up now
                  <FaChevronRight className="ml-1 text-xs" />
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Security Notice */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Your connection to this site is secure
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;