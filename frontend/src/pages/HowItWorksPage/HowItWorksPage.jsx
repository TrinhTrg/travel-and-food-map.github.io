import React from 'react';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import styles from './HowItWorksPage.module.css';
import { FiSearch, FiEye, FiEdit3 } from 'react-icons/fi'; // Import các icon

const HowItWorksPage = () => {
  return (
    <div className={styles.pageContainer}>
      <Navbar />

      <main className={styles.mainContent}>
        <h1>Nó hoạt động <span>như thế nào?</span></h1>
        <p className={styles.subtitle}>
          Khám phá, trải nghiệm và chia sẻ ẩm thực chưa bao giờ dễ dàng hơn thế.
          Chỉ với 3 bước đơn giản!
        </p>

        {/* Lưới 3 bước */}
        <div className={styles.stepsGrid}>
          {/* Bước 1 */}
          <div className={styles.step}>
            <FiSearch className={styles.icon} />
            <h2>1. Khám Phá</h2>
            <p>
              Sử dụng thanh tìm kiếm thông minh hoặc bản đồ trực quan để
              tìm thấy chính xác món ăn, nhà hàng, hoặc xu hướng ẩm thực
              quanh bạn.
            </p>
          </div>

          {/* Bước 2 */}
          <div className={styles.step}>
            <FiEye className={styles.icon} />
            <h2>2. Xem Đánh Giá</h2>
            <p>
              Đọc hàng ngàn đánh giá có tâm, xem hình ảnh món ăn thực tế
              do cộng đồng chụp để có quyết định khách quan nhất
              trước khi đi.
            </p>
          </div>

          {/* Bước 3 */}
          <div className={styles.step}>
            <FiEdit3 className={styles.icon} />
            <h2>3. Chia Sẻ</h2>
            <p>
              Đăng tải trải nghiệm của bạn! Viết review, chấm điểm,
              upload ảnh món ăn của bạn để giúp đỡ cộng đồng và
              trở thành một "reviewer" uy tín.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HowItWorksPage;