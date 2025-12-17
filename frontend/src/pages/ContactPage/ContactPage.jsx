import React, { useState } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import styles from './ContactPage.module.css';
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi'; // Icons
import { contactAPI } from '../../services/api';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
    // Clear message khi user nhập lại
    if (message.text) {
      setMessage({ type: '', text: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setMessage({
        type: 'error',
        text: 'Vui lòng điền đầy đủ thông tin',
      });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await contactAPI.sendContact(formData);
      setMessage({
        type: 'success',
        text: 'Gửi tin nhắn thành công! Chúng tôi sẽ phản hồi sớm nhất có thể.',
      });
      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Có lỗi xảy ra. Vui lòng thử lại sau.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <Navbar />

      <main className={styles.mainContent}>
        <h1>Liên hệ <span>với chúng tôi</span></h1>
        <p className={styles.subtitle}>
          Bạn có câu hỏi, góp ý hay muốn hợp tác? Hãy liên hệ với FoodGo!
        </p>

        {/* Hộp chứa 2 cột */}
        <div className={styles.contactBox}>
          
          {/* Cột 1: Thông tin liên hệ */}
          <div className={styles.infoSide}>
            <h2>Thông tin liên hệ</h2>
            <p>
              Chúng tôi luôn sẵn lòng lắng nghe bạn. Hãy liên hệ qua các
              kênh dưới đây.
            </p>
            <ul className={styles.infoList}>
              <li>
                <FiMail /> <span>support@foodgo.com</span>
              </li>
              <li>
                <FiPhone /> <span>+84 796 795 089</span>
              </li>
              <li>
                <FiMapPin /> <span>58A Lê Lợi, Hải Châu, Đà Nẵng</span>
              </li>
            </ul>
          </div>

          {/* Cột 2: Form liên hệ */}
          <form className={styles.formSide} onSubmit={handleSubmit}>
            {message.text && (
              <div
                className={
                  message.type === 'success'
                    ? styles.successMessage
                    : styles.errorMessage
                }
              >
                {message.text}
              </div>
            )}

            <div className={styles.formGroup}>
              <label htmlFor="name">Họ và tên</label>
              <input
                type="text"
                id="name"
                placeholder="Nguyễn Văn A"
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                placeholder="user@email.com"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="subject">Chủ đề</label>
              <input
                type="text"
                id="subject"
                placeholder="Tôi cần hỗ trợ..."
                value={formData.subject}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="message">Nội dung tin nhắn</label>
              <textarea
                id="message"
                rows="5"
                placeholder="Nội dung chi tiết..."
                value={formData.message}
                onChange={handleChange}
                disabled={loading}
              ></textarea>
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Đang gửi...' : 'Gửi tin nhắn'}
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ContactPage;