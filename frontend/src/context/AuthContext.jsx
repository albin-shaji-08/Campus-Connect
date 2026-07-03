import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [role, setRole] = useState(localStorage.getItem('role') || null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedRole = localStorage.getItem('role');
    setRole(savedRole);
  }, []);

  const login = (newRole) => {
    localStorage.setItem('role', newRole);
    setRole(newRole);
  };

  const logout = () => {
    // Clear role from localStorage
    localStorage.removeItem('role');
    
    // Clear any stored tokens
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    
    // Clear cookie
    document.cookie = 'token=; Max-Age=0; path=/';
    
    // Clear axios default headers
    delete axios.defaults.headers.common['Authorization'];
    
    // Update state
    setRole(null);
    
    // Show success message
    toast.success('Logged out successfully');
    
    // Redirect to home
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
