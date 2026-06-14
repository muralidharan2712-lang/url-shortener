import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/services';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('linkpulse_token');
    const savedUser = localStorage.getItem('linkpulse_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      // Verify token is still valid
      authService.getMe()
        .then((res) => {
          const u = res.data.data.user;
          setUser(u);
          localStorage.setItem('linkpulse_user', JSON.stringify(u));
        })
        .catch(() => {
          // Token invalid – clear session
          localStorage.removeItem('linkpulse_token');
          localStorage.removeItem('linkpulse_user');
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password, rememberMe = false) => {
    const res = await authService.login({ email, password, rememberMe });
    const { token: t, user: u } = res.data.data;
    setToken(t);
    setUser(u);
    localStorage.setItem('linkpulse_token', t);
    localStorage.setItem('linkpulse_user', JSON.stringify(u));
    return u;
  }, []);

  const signup = useCallback(async (name, email, password) => {
    const res = await authService.signup({ name, email, password });
    const { token: t, user: u } = res.data.data;
    setToken(t);
    setUser(u);
    localStorage.setItem('linkpulse_token', t);
    localStorage.setItem('linkpulse_user', JSON.stringify(u));
    return u;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('linkpulse_token');
    localStorage.removeItem('linkpulse_user');
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('linkpulse_user', JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
