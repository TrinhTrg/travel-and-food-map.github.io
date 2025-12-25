import React, { createContext, useContext, useState, useCallback } from 'react';
import NotificationContainer from '../components/Notification/NotificationContainer';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type: notification.type || 'info',
      title: notification.title,
      message: notification.message,
      duration: notification.duration !== undefined ? notification.duration : 3000,
      ...notification,
    };

    setNotifications((prev) => [...prev, newNotification]);

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Helper methods
  const showSuccess = useCallback((title, message, duration) => {
    return showNotification({ type: 'success', title, message, duration });
  }, [showNotification]);

  const showError = useCallback((title, message, duration) => {
    return showNotification({ type: 'error', title, message, duration: duration || 5000 });
  }, [showNotification]);

  const showWarning = useCallback((title, message, duration) => {
    return showNotification({ type: 'warning', title, message, duration });
  }, [showNotification]);

  const showInfo = useCallback((title, message, duration) => {
    return showNotification({ type: 'info', title, message, duration });
  }, [showNotification]);

  const value = {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer
        notifications={notifications}
        onClose={removeNotification}
      />
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

