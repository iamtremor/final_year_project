import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import api from '../utils/api';
// Create authentication context
const AuthContext = createContext();

// Authentication provider component
export const AuthProvider = ({ children }) => {
  // State for user and loading status
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Check for token and set auth state on first load
  useEffect(() => {
  const initializeAuth = async () => {
    try {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");
  
      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        
        // Use detailedRole if available, otherwise fall back to role
        const displayRole = parsedUser.detailedRole || 
                             (parsedUser.role === 'staff' ? 'Staff' : parsedUser.role);
        
        parsedUser.displayRole = displayRole;
        
        setUser(parsedUser);
        
        // Set axios header
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  initializeAuth();
}, []);
  
  // Login function for any role
  const login = async (credentials, role) => {
    try {
      const response = await axios.post(`/api/auth/${role}/login`, credentials);
      
      // Store token and user data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Format the user object with displayRole just like in initializeAuth
      const userWithDisplayRole = {
        ...response.data.user,
        displayRole: response.data.user.detailedRole || 
                    (response.data.user.role === 'staff' ? 'Staff' : response.data.user.role)
      };
      
      // Update the user state with the formatted user object
      setUser(userWithDisplayRole);
      
      // Set default axios header
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      
      return response.data;
    } catch (error) {
      console.error('Login Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error; // Re-throw to allow component to handle
    }
  };
  
  // Register function for any role
  const register = async (userData, role) => {
    try {
      const response = await axios.post(`/api/auth/${role}/register`, userData);
      
      // Store token and user data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Format the user object with displayRole
      const userWithDisplayRole = {
        ...response.data.user,
        displayRole: response.data.user.detailedRole || 
                    (response.data.user.role === 'staff' ? 'Staff' : response.data.user.role)
      };
      
      // Update the user state with the formatted user object
      setUser(userWithDisplayRole);
      
      // Set axios default header
      api.defaults.headers.common["Authorization"] = `Bearer ${response.data.token}`;
      
      return response.data;
    } catch (error) {
      console.error('Registration Error:', error);
      throw error; // Re-throw to allow component to handle
    }
  };
  
  // Logout function
  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Clear axios default header
    delete axios.defaults.headers.common['Authorization'];
    
    // Clear user state
    setUser(null);
  };
  
  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!localStorage.getItem('token');
  };
  
  // Check if user has specific role
  const hasRole = (role) => {
    const currentUser = user || JSON.parse(localStorage.getItem('user'));
    return currentUser && currentUser.role === role;
  };
  
  // Authentication context value
  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated,
    hasRole
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthContext;