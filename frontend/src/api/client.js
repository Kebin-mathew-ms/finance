import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization Token to outgoing requests if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // If the request payload is FormData, let Axios manage the boundary content-type automatically
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Gracefully handle global API errors (like token expiry)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear session data on authentication failure
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // If we are not on login/register pages, redirect to login
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/forgot-password') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
