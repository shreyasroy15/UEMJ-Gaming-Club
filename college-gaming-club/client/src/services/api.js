import axios from 'axios';

const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.includes('localhost')) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
  }
  if (import.meta.env.PROD) {
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
    }
    return '/api';
  }
  // In dev, use the current host (works for localhost on PC and 192.168.x.x on mobile)
  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  return `http://${host}:5000/api`;
};

const API = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  timeout: 15000,
});

// High-performance in-memory cache & in-flight request deduplication
const cache = new Map();
const inFlightRequests = new Map();
const CACHE_TTL = 120000; // 2 minutes

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

// Wrap API.get with intelligent caching and request deduplication
const originalGet = API.get.bind(API);

API.get = async (url, config = {}) => {
  if (config?.skipCache) {
    return originalGet(url, config);
  }

  const cacheKey = url + (config?.params ? JSON.stringify(config.params) : '');
  const now = Date.now();
  const cached = cache.get(cacheKey);

  if (cached && now - cached.timestamp < CACHE_TTL) {
    return Promise.resolve(cached.response);
  }

  // Deduplicate in-flight requests (prevent duplicate parallel network calls)
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  const requestPromise = originalGet(url, config)
    .then((res) => {
      if (res && res.status >= 200 && res.status < 300) {
        cache.set(cacheKey, { timestamp: Date.now(), response: res });
      }
      return res;
    })
    .finally(() => {
      inFlightRequests.delete(cacheKey);
    });

  inFlightRequests.set(cacheKey, requestPromise);
  return requestPromise;
};

// Prefetch common endpoints
export const prefetchAppResources = () => {
  const commonEndpoints = ['/tournaments', '/games', '/teams', '/matches', '/announcements'];
  setTimeout(() => {
    commonEndpoints.forEach((url) => {
      API.get(url).catch(() => {});
    });
  }, 50);
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
    // Detect HTML responses where JSON was expected (common SPA deployment rewrite error)
    if (
      typeof response.data === 'string' &&
      (response.data.trim().startsWith('<!doctype') ||
        response.data.trim().startsWith('<html') ||
        response.data.includes('<div id="root">'))
    ) {
      return Promise.reject(
        new Error(
          `API response error: Received HTML instead of JSON for ${response.config?.url}. ` +
          `Check backend hosting or verify VITE_API_URL environment variable.`
        )
      );
    }

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

