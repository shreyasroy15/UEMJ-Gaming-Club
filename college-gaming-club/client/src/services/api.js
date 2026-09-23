import axios from 'axios';

const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.includes('localhost')) {
    return import.meta.env.VITE_API_URL;
  }
  if (import.meta.env.PROD) {
    return '/api';
  }
  // In dev, use the current host (works for localhost on PC and 192.168.x.x on mobile)
  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  return `http://${host}:5000/api`;
};

const API = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
});

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 60000; // 60 seconds

export const clearApiCache = (urlPrefix = null) => {
  if (!urlPrefix) {
    cache.clear();
  } else {
    for (const key of cache.keys()) {
      if (key.startsWith(urlPrefix) || key.includes(urlPrefix)) {
        cache.delete(key);
      }
    }
  }
};

// Prefetch common endpoints
export const prefetchAppResources = () => {
  const commonEndpoints = ['/tournaments', '/games', '/teams', '/matches'];
  setTimeout(() => {
    commonEndpoints.forEach((url) => {
      API.get(url).catch(() => {});
    });
  }, 100);
};

// Interceptor to attach JWT token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('gaming_club_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
API.interceptors.response.use(
  (response) => {
    const method = response.config?.method?.toLowerCase();
    if (['post', 'put', 'delete', 'patch'].includes(method)) {
      clearApiCache();
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      const isConcurrent = error.response.data?.code === 'CONCURRENT_LOGIN_DETECTED';
      if (localStorage.getItem('gaming_club_token')) {
        localStorage.removeItem('gaming_club_token');
        localStorage.removeItem('gaming_club_user');
      }
      if (isConcurrent && typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('auth:concurrent_session', {
            detail: {
              message:
                error.response.data?.message ||
                'Your account was logged in from another device. You have been logged out.',
            },
          })
        );
      }
    }
    return Promise.reject(error);
  }
);

export default API;

