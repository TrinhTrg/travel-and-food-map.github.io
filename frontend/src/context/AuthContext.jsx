import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Kiểm tra token khi component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authAPI.getProfile()
        .then((response) => {
          if (response.success) {
            setUser(response.data.user);
            setIsAuthenticated(true);
          }
        })
        .catch(() => {
          localStorage.removeItem('token');
          setUser(null);
          setIsAuthenticated(false);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      if (response.success) {
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
        setIsAuthenticated(true);
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Đăng nhập thất bại'
      };
    }
  };

  const register = async (userData) => {
    try {
      // THÊM ROLE MẶC ĐỊNH
      const registerData = {
        ...userData,
        role: 'user'
      };

      const response = await authAPI.register(registerData);
      if (response.success) {
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
        setIsAuthenticated(true);
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Đăng ký thất bại'
      };
    }
  };

  const forgotPassword = async (email, newPassword) => {
    try {
      const response = await authAPI.forgotPassword(email, newPassword);
      if (response.success) {
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Đặt lại mật khẩu thất bại'
      };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Refresh user profile (useful when role changes)
  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await authAPI.getProfile();
      if (response.success) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  }, []);

  // Helper để kiểm tra role
  const isAdmin = user?.role === 'admin';
  const isOwner = user?.role === 'owner';
  const isOwnerOrAdmin = isOwner || isAdmin;

  const value = {
    user,
    isAuthenticated,
    loading,
    isAdmin,
    isOwner,
    isOwnerOrAdmin,
    login,
    register,
    forgotPassword,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>; // children là các component con bên trong AuthProvider
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};