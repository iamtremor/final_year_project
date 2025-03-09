import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Unauthorized = () => {
  const { user, logout } = useAuth();
  
  // Determine redirect link based on user role (if logged in)
  const getRedirectLink = () => {
    if (!user) return '/';
    
    switch (user.role) {
      case 'student':
        return '/student/dashboard';
      case 'staff':
        return '/staff/dashboard';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg text-center">
        <div className="mb-6">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="mx-auto h-16 w-16 text-red-500" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Unauthorized Access
        </h1>
        
        <p className="text-gray-600 mb-6">
          You don't have permission to access this page. Please log in with appropriate credentials or navigate to an authorized page.
        </p>
        
        <div className="flex flex-col space-y-3">
          <Link
            to={getRedirectLink()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            {user ? 'Go to Dashboard' : 'Go to Home'}
          </Link>
          
          {user && (
            <button
              onClick={logout}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;