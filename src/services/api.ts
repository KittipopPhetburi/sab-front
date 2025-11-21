import axios from 'axios';

// Base API URL - ปรับตาม environment ของคุณ
// Prefer Vite env variable; fallback to relative '/api' so Vite dev proxy can forward requests.
// To override in production, set VITE_API_BASE_URL.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || '/api';

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});
// Log the base URL used so developers can quickly diagnose proxy issues
if (import.meta.env.DEV) {
  console.debug('API base URL:', API_BASE_URL);
}

// Add request interceptor for authentication token (if needed)
apiClient.interceptors.request.use(
  (config) => {
    // You can add auth token here if needed
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Export the base url in case other pages still need to construct custom endpoints
export { API_BASE_URL };

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network Error:', error.message);
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);