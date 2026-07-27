import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to automatically attach authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional response interceptor to format errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the server returned an error response, format and reject
    if (error.response && error.response.data) {
      return Promise.reject(error.response.data);
    }
    return Promise.reject({ message: error.message || 'Network error encountered' });
  }
);

export default api;
