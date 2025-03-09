import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles, redirectPath = '/' }) => {
  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem('user'));
  
  // Check if token exists
  const token = localStorage.getItem('token');
  const isAuthenticated = !!token;
  
  // Check if user has required role
  const hasRequiredRole = user && 
    (allowedRoles ? allowedRoles.includes(user.role) : true);
  
  // If not authenticated, redirect to appropriate login page
  if (!isAuthenticated) {
    let loginPath = '/';
    
    // Determine which login page to redirect to based on the allowed roles
    if (allowedRoles) {
      if (allowedRoles.includes('student')) {
        loginPath = '/student/login';
      } else if (allowedRoles.includes('staff')) {
        loginPath = '/staff/login';
      } else if (allowedRoles.includes('admin')) {
        loginPath = '/admin/login';
      }
    }
    
    return <Navigate to={loginPath} replace />;
  }
  
  // If role check is required and user doesn't have required role
  if (allowedRoles && !hasRequiredRole) {
    return <Navigate to={redirectPath} replace />;
  }
  
  // If authenticated and has required role, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;