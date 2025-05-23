import axios from 'axios';

// Create an axios instance with custom defaults
const instance = axios.create({
  baseURL: 'https://trizenlmsinstructorbackend.llp.trizenventures.com',  // Backend URL
  // baseURL: 'http://localhost:3000',  // Backend URL
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Add request interceptor to include auth token (if available)
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors like 401 (unauthorized)
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('auth_token');
      // Force reload to clear app state
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
