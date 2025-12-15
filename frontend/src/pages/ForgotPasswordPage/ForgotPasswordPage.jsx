// src/pages/ForgotPasswordPage/ForgotPasswordPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import styles from './ForgotPasswordPage.module.css';
import { FaEnvelope, FaCheckCircle } from 'react-icons/fa';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Vui lòng nhập email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Email không hợp lệ');
      return;
    }

    setLoading(true);
    
    setTimeout(() => {
      setLoading(false);
      setStep(2);
      setSuccess('Email hợp lệ. Vui lòng đặt mật khẩu mới.');
    }, 1000);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newPassword || !confirmPassword) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);

    const result = await forgotPassword(email, newPassword);
    setLoading(false);

    if (result.success) {
      setSuccess('Đặt lại mật khẩu thành công!');
      setTimeout(() => {
        navigate('/dang-nhap');
      }, 2000);
    } else {
      setError(result.message || 'Đặt lại mật khẩu thất bại');
    }
  };

  return (
    <div className={styles.pageContainer}>
      <Navbar />
      <div className={styles.forgotPasswordContainer}>
        <div className={styles.forgotPasswordCard}>
          <h1 className={styles.title}>Quên mật khẩu</h1>
          <p className={styles.subtitle}>
            {step === 1 
              ? 'Nhập email để đặt lại mật khẩu' 
              : 'Đặt mật khẩu mới cho tài khoản của bạn'
            }
          </p>

          {error && <div className={styles.errorMessage}>{error}</div>}
          {success && <div className={styles.successMessage}>{success}</div>}

          {step === 1 ? (
            <form onSubmit={handleEmailSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <FaEnvelope className={styles.inputIcon} />
                <input
                  type="email"
                  placeholder="Email của bạn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={loading}
              >
                {loading ? 'Đang kiểm tra...' : 'Tiếp theo'}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePasswordSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <FaCheckCircle className={styles.inputIcon} />
                <input
                  type="password"
                  placeholder="Mật khẩu mới"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={styles.input}
                  disabled={loading}
                />
              </div>

              <div className={styles.inputGroup}>
                <FaCheckCircle className={styles.inputIcon} />
                <input
                  type="password"
                  placeholder="Xác nhận mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={styles.input}
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={loading}
              >
                {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
              </button>
            </form>
          )}

          <div className={styles.footer}>
            <p>
              Nhớ mật khẩu?{' '}
              <Link to="/dang-nhap" className={styles.link}>
                Đăng nhập ngay
              </Link>
            </p>
            <p>
              Chưa có tài khoản?{' '}
              <Link to="/dang-ky" className={styles.link}>
                Đăng ký tại đây
              </Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ForgotPasswordPage;