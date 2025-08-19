import React, { createContext, useState, useCallback } from 'react';
import { message } from 'antd';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (username, password) => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Replace with actual authentication logic
      if (username && password) {
        setIsAuthenticated(true);
        setUser({ 
          username,
          role: 'admin' // Add actual role from your auth system
        });
        message.success('Login successful');
        return true;
      }
      throw new Error('Invalid credentials');
    } catch (error) {
      message.error(error.message || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setUser(null);
    message.success('Logged out successfully');
  }, []);

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        user, 
        loading,
        login, 
        logout,
        setUser // Optional for user updates
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

