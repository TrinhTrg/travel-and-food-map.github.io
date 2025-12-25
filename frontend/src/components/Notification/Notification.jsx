import React, { useEffect, useState } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes, FaTimesCircle } from 'react-icons/fa';
import styles from './Notification.module.css';

const Notification = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 10);

    // Auto close after duration
    if (notification.duration !== 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, notification.duration || 3000);

      return () => clearTimeout(timer);
    }
  }, [notification.duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(notification.id);
    }, 300); // Match animation duration
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <FaCheckCircle className={styles.iconSuccess} />;
      case 'error':
        return <FaTimesCircle className={styles.iconError} />;
      case 'warning':
        return <FaExclamationCircle className={styles.iconWarning} />;
      case 'info':
      default:
        return <FaInfoCircle className={styles.iconInfo} />;
    }
  };

  return (
    <div
      className={`${styles.notification} ${styles[notification.type]} ${isVisible && !isExiting ? styles.visible : ''} ${isExiting ? styles.exiting : ''}`}
      onClick={handleClose}
    >
      <div className={styles.notificationContent}>
        <div className={styles.iconWrapper}>
          {getIcon()}
        </div>
        <div className={styles.messageWrapper}>
          <div className={styles.title}>{notification.title || getDefaultTitle()}</div>
          {notification.message && (
            <div className={styles.message}>{notification.message}</div>
          )}
        </div>
        <button
          className={styles.closeButton}
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          aria-label="Đóng"
        >
          <FaTimes />
        </button>
      </div>
      {notification.duration !== 0 && (
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{
              animationDuration: `${notification.duration || 3000}ms`,
            }}
          />
        </div>
      )}
    </div>
  );

  function getDefaultTitle() {
    switch (notification.type) {
      case 'success':
        return 'Thành công';
      case 'error':
        return 'Lỗi';
      case 'warning':
        return 'Cảnh báo';
      case 'info':
      default:
        return 'Thông báo';
    }
  }
};

export default Notification;

