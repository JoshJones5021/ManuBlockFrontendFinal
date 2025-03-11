// src/utils/axios.js - Updated version
// This file configures the base API setup with interceptors for authentication

import axios from 'axios';

// Use environment variable or fallback to localhost during development
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const instance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // Increased timeout for slower connections
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add a request interceptor to add the auth token to requests
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle network errors
    if (!error.response) {
      console.error('Network Error:', error.message);
      return Promise.reject(
        new Error('Network error. Please check your internet connection.')
      );
    }

    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      // Clear local storage and redirect to login on auth errors
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if not already on login page to prevent redirect loops
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    // If the error has a specific message from the server, use it
    if (error.response && error.response.data && error.response.data.error) {
      return Promise.reject(
        new Error(error.response.data.error)
      );
    }

    // For server errors, provide a more user-friendly message
    if (error.response && error.response.status >= 500) {
      return Promise.reject(
        new Error('Server error. Please try again later or contact support.')
      );
    }

    return Promise.reject(error);
  }
);

// Add a method to check API health
instance.checkHealth = async () => {
  try {
    const response = await instance.get('/test', { timeout: 5000 });
    return { status: 'UP', message: response.data };
  } catch (error) {
    return { status: 'DOWN', error: error.message };
  }
};

export default instance;