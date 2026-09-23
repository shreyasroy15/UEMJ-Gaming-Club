import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('gaming_club_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('gaming_club_token') || null);
  const [loading, setLoading] = useState(true);

  // Fetch current user on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      const storedToken = localStorage.getItem('gaming_club_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await API.get('/auth/me');
        if (res.data.success && res.data.user) {
          setUser(res.data.user);
          localStorage.setItem('gaming_club_user', JSON.stringify(res.data.user));
        }
      } catch (err) {
        console.error('Failed to authenticate session:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Listen for concurrent session termination (login on another device)
  useEffect(() => {
    const handleConcurrentSession = (e) => {
      setUser(null);
      setToken(null);
      localStorage.removeItem('gaming_club_token');
      localStorage.removeItem('gaming_club_user');
      const msg =
        e.detail?.message ||
        'Your account was logged in from another device. You have been logged out.';
      alert(msg);
      window.location.href = '/login';
    };

    window.addEventListener('auth:concurrent_session', handleConcurrentSession);
    return () =>
      window.removeEventListener('auth:concurrent_session', handleConcurrentSession);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await API.post('/auth/login', { email, password });
      if (res.data.success) {
        setUser(res.data.user);
        setToken(res.data.token);
        localStorage.setItem('gaming_club_token', res.data.token);
        localStorage.setItem('gaming_club_user', JSON.stringify(res.data.user));
        return { success: true, user: res.data.user };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please verify your credentials.';
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    try {
      const res = await API.post('/auth/register', userData);
      if (res.data.success) {
        setUser(res.data.user);
        setToken(res.data.token);
        localStorage.setItem('gaming_club_token', res.data.token);
        localStorage.setItem('gaming_club_user', JSON.stringify(res.data.user));
        return { success: true, user: res.data.user };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed. Please check your information.';
      return { success: false, message };
    }
  };

  const logout = () => {
    try {
      API.post('/auth/logout');
    } catch (e) {
      // Ignore
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('gaming_club_token');
    localStorage.removeItem('gaming_club_user');
  };

  const updateUser = (updatedData) => {
    const updated = { ...user, ...updatedData };
    setUser(updated);
    localStorage.setItem('gaming_club_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated: !!user,
        isAdmin: ['admin', 'super_admin'].includes(user?.role) || user?.email === 'admin@gmail.com',
        isStaff: ['admin', 'super_admin', 'moderator', 'staff', 'coordinator'].includes(user?.role) || user?.email === 'admin@gmail.com',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
