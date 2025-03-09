import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

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
          // 🔍 Store user with token
          const parsedUser = JSON.parse(userData);
          parsedUser.token = token; // Attach token to user object
          setUser(parsedUser);
          
          // Set axios header
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
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
    const response = await axios.post(`http://localhost:5000/api/auth/${role}/login`, credentials);
  
    const userWithToken = { ...response.data.user, token: response.data.token };
    
    // Store token and user in localStorage
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("user", JSON.stringify(userWithToken));
  
    // Set axios default header
    axios.defaults.headers.common["Authorization"] = `Bearer ${response.data.token}`;
  
    setUser(userWithToken);
    return response.data;
  };
  
  const register = async (userData, role) => {
    const response = await axios.post(`http://localhost:5000/api/auth/${role}/register`, userData);
  
    const userWithToken = { ...response.data.user, token: response.data.token };
  
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("user", JSON.stringify(userWithToken));
  
    axios.defaults.headers.common["Authorization"] = `Bearer ${response.data.token}`;
  
    setUser(userWithToken);
    return response.data;
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