import React from 'react';
import Notification from './Notification';
import styles from './Notification.module.css';

const NotificationContainer = ({ notifications, onClose }) => {
  return (
    <div className={styles.notificationContainer}>
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          notification={notification}
          onClose={onClose}
        />
      ))}
    </div>
  );
};

export default NotificationContainer;

