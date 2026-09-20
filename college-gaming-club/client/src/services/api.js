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

// Fast In-Memory SWR (Stale-While-Revalidate) Cache & In-Flight Request Deduplication
const apiCache = new Map();
const inflightRequests = new Map();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds cache TTL

export const clearApiCache = (urlPrefix = null) => {
  if (!urlPrefix) {
    apiCache.clear();
  } else {
    for (const key of apiCache.keys()) {
      if (key.startsWith(urlPrefix) || key.includes(urlPrefix)) {
        apiCache.delete(key);
      }
    }
  }
};

// Prefetch common endpoints concurrently in the background for instant page transitions
export const prefetchAppResources = () => {
  const commonEndpoints = ['/tournaments', '/games', '/teams', '/matches'];
  setTimeout(() => {
    commonEndpoints.forEach((url) => {
      API.get(url).catch(() => {});
    });
  }, 100);
};

// Intercept original GET to serve cached data instantly and revalidate in background
const originalGet = API.get.bind(API);

API.get = function (url, config = {}) {
  // Bypass cache if explicitly requested
  if (config.skipCache) {
    return originalGet(url, config);
  }

  const paramKey = config.params ? JSON.stringify(config.params) : '';
  const cacheKey = `${url}?${paramKey}`;
  const now = Date.now();
  const cached = apiCache.get(cacheKey);

  // Return fresh cache instantly if available
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    // Revalidate in background if older than 12s
    if (now - cached.timestamp > 12000 && !inflightRequests.has(cacheKey)) {
      const bgPromise = originalGet(url, config)
        .then((res) => {
          if (res.status === 200 && res.data) {
            apiCache.set(cacheKey, { data: res.data, response: res, timestamp: Date.now() });
          }
          return res;
        })
        .catch(() => {})
        .finally(() => {
          inflightRequests.delete(cacheKey);
        });
      inflightRequests.set(cacheKey, bgPromise);
    }

    return Promise.resolve({
      ...cached.response,
      data: cached.data,
      fromCache: true,
    });
  }

  // Deduplicate inflight requests to avoid duplicate fetches
  if (inflightRequests.has(cacheKey)) {
    return inflightRequests.get(cacheKey);
  }

  const reqPromise = originalGet(url, config)
    .then((res) => {
      if (res.status === 200 && res.data) {
        apiCache.set(cacheKey, {
          data: res.data,
          response: { status: res.status, statusText: res.statusText, headers: res.headers },
          timestamp: Date.now(),
        });
      }
      return res;
    })
    .finally(() => {
      inflightRequests.delete(cacheKey);
    });

  inflightRequests.set(cacheKey, reqPromise);
  return reqPromise;
};

// Interceptor to attach JWT token to every request
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

// Response interceptor: invalidate cache on data mutations and handle 401
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
      if (localStorage.getItem('gaming_club_token')) {
        localStorage.removeItem('gaming_club_token');
        localStorage.removeItem('gaming_club_user');
      }
    }
    return Promise.reject(error);
  }
);

export default API;

