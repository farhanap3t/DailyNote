import React, { createContext, useContext, useState, useEffect } from 'react';
const AuthContext = createContext();
import { api } from '../api/client';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = api.getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await api.getMe();
        setUser(data.user);
      } catch (err) {
        console.error('Failed to restore session:', err);
        api.setToken(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();

    const handleUnauthorized = () => {
      setUser(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    api.setToken(data.token);
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password, confirmPassword) => {
    const data = await api.register(name, email, password, confirmPassword);
    api.setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try {
      await api.request('/auth/logout', { method: 'POST' });
    } catch (e) {}
    api.setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(prev => ({ ...prev, ...updatedUser }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

