import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }

    try {
      const response = await api.get('/auth/profile');
      // Set the returned user profile (which now contains profilePicture and address) globally
      setUser(response.data);
      setLoading(false);
      return response.data;
    } catch (err) {
      console.error('[DEV] Failed to fetch global user profile context:', err);
      // Clean stale tokens if unauthorized
      localStorage.removeItem('token');
      setUser(null);
      setLoading(false);
      return null;
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('[DEV] Logout API request warning:', err);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      window.location.hash = '#login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, fetchProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
