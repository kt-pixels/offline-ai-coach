import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('coach_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await authService.me();
        setUser(data.user);
      } catch (error) {
        localStorage.removeItem('coach_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const login = async (payload) => {
    const data = await authService.login(payload);
    localStorage.setItem('coach_token', data.token);
    setUser(data.user);
    return data;
  };

  const register = async (payload) => {
    const data = await authService.register(payload);
    localStorage.setItem('coach_token', data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('coach_token');
    setUser(null);
  };

  const refreshUser = async () => {
    const data = await authService.me();
    setUser(data.user);
    return data.user;
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refreshUser
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
