import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';
import styles from './LoginModal.module.css';

const LoginModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLogin = () => {
    onClose();
    navigate('/dang-nhap');
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          <FaTimes />
        </button>
        <h2 className={styles.modalTitle}>Đăng nhập hệ thống</h2>
        <p className={styles.modalMessage}>
          Bạn vui lòng đăng nhập để thực hiện chức năng này.
        </p>
        <div className={styles.modalActions}>
          <button className={styles.loginButton} onClick={handleLogin}>
            Đăng nhập
          </button>
          <button className={styles.cancelButton} onClick={onClose}>
            Huỷ
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;

