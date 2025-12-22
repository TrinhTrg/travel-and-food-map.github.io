import React from 'react';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import styles from './HowItWorksPage.module.css';
import { FiUsers, FiTarget, FiHeart, FiAward } from 'react-icons/fi'; // Import các icon

const AboutUsPage = () => {
  return (
    <div className={styles.pageContainer}>
      <Navbar />

      <main className={styles.mainContent}>
        <h1>Về <span>Chúng Tôi</span></h1>
        <p className={styles.subtitle}>
          FoodGo - Ứng dụng tìm hiểu và khám phá ẩm thực đầu tiên tại Việt Nam.
          Mang đến cho bạn những trải nghiệm ẩm thực tuyệt vời nhất.
        </p>

        {/* Lưới 4 phần giới thiệu */}
        <div className={styles.stepsGrid}>
          {/* Phần 1 */}
          <div className={styles.step}>
            <FiUsers className={styles.icon} />
            <h2>Sứ Mệnh</h2>
            <p>
              Chúng tôi kết nối những người yêu ẩm thực, tạo ra một cộng đồng
              nơi mọi người có thể khám phá, chia sẻ và trải nghiệm những món ăn
              tuyệt vời nhất.
            </p>
          </div>

          {/* Phần 2 */}
          <div className={styles.step}>
            <FiTarget className={styles.icon} />
            <h2>Tầm Nhìn</h2>
            <p>
              Trở thành nền tảng hàng đầu về ẩm thực tại Việt Nam, giúp mọi người
              dễ dàng tìm thấy những địa điểm ăn uống phù hợp và chia sẻ trải nghiệm
              của mình với cộng đồng.
            </p>
          </div>

          {/* Phần 3 */}
          <div className={styles.step}>
            <FiHeart className={styles.icon} />
            <h2>Giá Trị Cốt Lõi</h2>
            <p>
              Chúng tôi tin vào sự minh bạch, chân thực và cộng đồng. Mọi đánh giá
              và chia sẻ đều được tạo ra từ trải nghiệm thực tế của người dùng.
            </p>
          </div>

          {/* Phần 4 */}
          <div className={styles.step}>
            <FiAward className={styles.icon} />
            <h2>Cam Kết</h2>
            <p>
              FoodGo cam kết mang đến trải nghiệm tốt nhất cho người dùng, với
              dữ liệu chính xác, giao diện thân thiện và cộng đồng tích cực.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AboutUsPage;