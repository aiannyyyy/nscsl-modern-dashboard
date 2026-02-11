import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

api.interceptors.request.use(
    (config) => {
        // Change 'token' to 'authToken' to match your AuthContext
        const token = localStorage.getItem('authToken'); // ← Change this line
        
        console.log('🔍 Interceptor running');
        console.log('🔍 Token from localStorage:', token ? 'EXISTS' : 'NULL');
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('✅ Authorization header set');
        } else {
            console.log('❌ No token found');
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
            console.log('❌ 401 Authentication error - redirecting to login');
            // You can add redirect logic here if needed
            // window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;