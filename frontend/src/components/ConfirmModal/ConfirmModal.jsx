import React from 'react';
import { FaExclamationTriangle, FaCheckCircle, FaInfoCircle, FaTimesCircle } from 'react-icons/fa';
import styles from './ConfirmModal.module.css';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Xác nhận', 
  message, 
  confirmText = 'OK', 
  cancelText = 'Hủy',
  type = 'warning', // warning, danger, info, success
  confirmButtonStyle = 'primary', // primary, danger
  isProcessing = false
}) => {
  const [processing, setProcessing] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) {
      setProcessing(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    if (processing || isProcessing) return; // Prevent double-click
    
    setProcessing(true);
    try {
      if (onConfirm) {
        await onConfirm();
      }
    } catch (error) {
      console.error('Error in confirm handler:', error);
      // Error notification is handled by the onConfirm handler
    } finally {
      setProcessing(false);
      // Always close modal after processing (success or error)
      // Error notifications are shown via NotificationContext
      onClose();
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <FaTimesCircle className={styles.iconDanger} />;
      case 'success':
        return <FaCheckCircle className={styles.iconSuccess} />;
      case 'info':
        return <FaInfoCircle className={styles.iconInfo} />;
      case 'warning':
      default:
        return <FaExclamationTriangle className={styles.iconWarning} />;
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalContent}>
          <div className={`${styles.iconContainer} ${styles[type]}`}>
            {getIcon()}
          </div>
          
          <div className={styles.textContainer}>
            <h3 className={styles.title}>{title}</h3>
            {message && (
              <p className={styles.message}>{message}</p>
            )}
          </div>

          <div className={styles.buttonGroup}>
            <button
              className={`${styles.button} ${styles.cancelButton}`}
              onClick={(e) => {
                e?.preventDefault();
                e?.stopPropagation();
                if (!processing && !isProcessing) {
                  onClose();
                }
              }}
              disabled={processing || isProcessing}
            >
              {cancelText}
            </button>
            <button
              className={`${styles.button} ${styles[confirmButtonStyle]}Button`}
              onClick={handleConfirm}
              disabled={processing || isProcessing}
              type="button"
            >
              {processing || isProcessing ? 'Đang xử lý...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

