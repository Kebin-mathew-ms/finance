import React, { createContext, useState, useEffect } from 'react';
import apiClient from '../api/client';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  // Initial session recovery check
  useEffect(() => {
    const recoverSession = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await apiClient.get('/users/me');
          setUser(res.data);
        } catch (err) {
          console.error("Session recovery failed:", err);
          localStorage.removeItem('token');
        }
      }
      setAuthChecking(false);
    };
    recoverSession();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const { access_token } = res.data;
      localStorage.setItem('token', access_token);
      
      // Fetch user profile info
      const profileRes = await apiClient.get('/users/me');
      setUser(profileRes.data);
      setLoading(false);
      return { success: true };
    } catch (err) {
      setLoading(false);
      const msg = err.response?.data?.detail || 'Authentication failed. Please try again.';
      return { success: false, error: msg };
    }
  };

  const register = async (fields) => {
    setLoading(true);
    try {
      await apiClient.post('/auth/register', fields);
      setLoading(false);
      return { success: true };
    } catch (err) {
      setLoading(false);
      const msg = err.response?.data?.detail || 'Registration failed. Please check inputs.';
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      console.warn("Logout endpoint call error (ignoring client-side purge):", err);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      setLoading(false);
    }
  };

  const updateProfile = async (formData) => {
    setLoading(true);
    try {
      const res = await apiClient.put('/users/me', formData);
      setUser(res.data);
      setLoading(false);
      return { success: true };
    } catch (err) {
      setLoading(false);
      const msg = err.response?.data?.detail || 'Profile update failed.';
      return { success: false, error: msg };
    }
  };

  const changePassword = async (payload) => {
    setLoading(true);
    try {
      const res = await apiClient.put('/users/change-password', payload);
      setUser(res.data);
      setLoading(false);
      return { success: true };
    } catch (err) {
      setLoading(false);
      const msg = err.response?.data?.detail || 'Password update failed.';
      return { success: false, error: msg };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      authChecking,
      login,
      register,
      logout,
      updateProfile,
      changePassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};
