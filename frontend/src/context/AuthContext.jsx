import { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './authContextDef';
import { authApi } from '../services/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('annapurna_token'));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('annapurna_token');
    setToken(null);
    setUser(null);
  }, []);

  // Validate existing token and restore user session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('annapurna_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await authApi.getMe();
        if (response?.user) {
          setUser(response.user);
        } else {
          logout();
        }
      } catch (err) {
        console.warn('Session expired or invalid, logging out:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [logout]);

  const login = async (email, password) => {
    const response = await authApi.login({ email, password });
    if (response?.token && response?.user) {
      localStorage.setItem('annapurna_token', response.token);
      setToken(response.token);
      setUser(response.user);
      return response.user;
    }
    throw new Error('Invalid login response from server');
  };

  const register = async (userData) => {
    const response = await authApi.register(userData);
    if (response?.token && response?.user) {
      localStorage.setItem('annapurna_token', response.token);
      setToken(response.token);
      setUser(response.user);
      return response.user;
    }
    throw new Error('Invalid registration response from server');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
