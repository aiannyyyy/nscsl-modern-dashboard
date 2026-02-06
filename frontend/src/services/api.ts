import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Add a request interceptor to include the token
api.interceptors.request.use(
    (config) => {
        // Get token from localStorage - MATCH THE KEY NAME
        const token = localStorage.getItem('authToken'); // ← Change from 'token' to 'authToken'
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            console.log('Authentication error - redirecting to login');
            // You can add redirect logic here if needed
            // window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;