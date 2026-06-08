import axios from 'axios';

// Create a pre-configured axios instance for production-style API client
const apiClient = axios.create({
  baseURL: '', // Using relative URLs since Vite proxies '/auth' to Flask
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically attach authorization header
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle global errors (e.g., unauthorized)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the token is invalid or expired, we can clean up localStorage
    if (error.response && error.response.status === 401) {
      const isLoginOrRegister = 
        error.config.url?.includes('/auth/login') || 
        error.config.url?.includes('/auth/register');
      
      if (!isLoginOrRegister) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('userEmail');
        
        // Optionally redirect or reload to trigger a state update
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
