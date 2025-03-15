import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Adjust to your backend URL
  withCredentials: true // If using cookies
});

// Request interceptor for adding token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    // Global error handling
    if (error.response && error.response.status === 401) {
      // Token might be expired, trigger logout
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export default api;