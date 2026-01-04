// AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for auth token and user data on mount
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser({ ...userData, isAuthenticated: true });
        
        // Set the token in axios defaults for all requests
        API.defaults.headers.common['Authorization'] = token;
      } catch (error) {
        // Clear invalid data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    
    setLoading(false);
  }, []);

  const login = (userData) => {
    if (!userData) return;
    
    // Store user data with all available properties
    const userToStore = {
      email: userData.email,
      role: userData.role,
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      organizationId: userData.organizationId || '',
      departmentId: userData.departmentId || '',
      userId: userData.userId || '',
      isAuthenticated: true
    };
    
    setUser(userToStore);
    localStorage.setItem('user', JSON.stringify(userToStore));
    
    if (userData.token) {
      const token = userData.token.startsWith('Bearer ') 
        ? userData.token 
        : `Bearer ${userData.token}`;
      
      localStorage.setItem('token', token);
      API.defaults.headers.common['Authorization'] = token;
    }
  };

  const updateUserData = (updatedData) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const logout = async () => {
    try {
      // Try to call the logout API endpoint
      if (user?.isAuthenticated) {
        await API.post('/auth/logout');
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Clear user data regardless of API success/failure
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      delete API.defaults.headers.common['Authorization'];
    }
  };

  const value = {
    user,
    login,
    logout,
    updateUserData,
    loading,
    isAuthenticated: !!user?.isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
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