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
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      const isAuthRoute = 
        originalRequest.url?.includes('/auth/login') || 
        originalRequest.url?.includes('/auth/register') ||
        originalRequest.url?.includes('/auth/refresh');
      
      if (!isAuthRoute) {
        const errorData = error.response.data?.data;
        const errMessage = error.response.data?.message || '';
        const isExpired = errorData?.error_code === 'TOKEN_EXPIRED' || errMessage.includes('expired') || errMessage.includes('ExpiredSignatureError');
        
        if (isExpired) {
          originalRequest._retry = true;
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            try {
              // Direct POST using base axios instance to avoid infinite loop
              const refreshResponse = await axios.post('/auth/refresh', {
                refresh_token: refreshToken
              });
              
              const newTokens = refreshResponse.data?.data;
              if (newTokens?.access_token && newTokens?.refresh_token) {
                localStorage.setItem('access_token', newTokens.access_token);
                localStorage.setItem('refresh_token', newTokens.refresh_token);
                
                // Retry the original request with the new access token
                originalRequest.headers.Authorization = `Bearer ${newTokens.access_token}`;
                return apiClient(originalRequest);
              }
            } catch (refreshErr) {
              console.error('Interceptor token refresh failed:', refreshErr);
            }
          }
        }
        
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('userEmail');
        
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
