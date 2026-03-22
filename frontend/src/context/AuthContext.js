import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('mc_token');
    const userData = localStorage.getItem('mc_user');
    if (token && userData) {
      setUser(JSON.parse(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await axios.post(`${API}/auth/login`, { email, password });
    localStorage.setItem('mc_token', data.token);
    localStorage.setItem('mc_user', JSON.stringify(data));
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUser(data);
    return data;
  };

  const register = async (username, email, password) => {
    const { data } = await axios.post(`${API}/auth/register`, { username, email, password });
    localStorage.setItem('mc_token', data.token);
    localStorage.setItem('mc_user', JSON.stringify(data));
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUser(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('mc_token');
    localStorage.removeItem('mc_user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const updateUserPoints = (totalPoints) => {
    const updated = { ...user, totalPoints };
    setUser(updated);
    localStorage.setItem('mc_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, updateUserPoints }}>
      {children}
    </AuthContext.Provider>
  );
};
