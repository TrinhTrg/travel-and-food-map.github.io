import React from 'react';
import styles from './HeroSection.module.css';
import { Link } from 'react-router-dom';
// Import các icon
import { FiSearch, FiMapPin, FiSliders, FiStar, FiImage, FiMap } from 'react-icons/fi';

// Import các ảnh món ăn từ assets
import imgGoiCuon from '../../assets/goi-cuon.png';
import imgBunBoHue from '../../assets/bun-bo-Hue.png';
import imgCaPheMuoi from '../../assets/ca-phe-muoi.png';
import imgBanhMi from '../../assets/banh-mi.png';

const HeroSection = () => {
  return (
    <main className={styles.heroContainer}>
      {/* Các ảnh "bay" - đây là phần CSS nâng cao */}
      <img src={imgGoiCuon} alt="Gỏi cuốn" className={`${styles.floatingImage} ${styles.image1}`} />
      <img src={imgBunBoHue} alt="Bún bò Huế" className={`${styles.floatingImage} ${styles.image2}`} />
      <img src={imgCaPheMuoi} alt="Cà phê muối" className={`${styles.floatingImage} ${styles.image3}`} />
      <img src={imgBanhMi} alt="Bánh mì" className={`${styles.floatingImage} ${styles.image4}`} />

      {/* Nội dung chính ở giữa */}
      <div className={styles.content}>
        <h1>Khám phá món ngon <span>gần bạn</span></h1>
        <p>Tìm quán ăn yêu thích, xem đánh giá thực tế, và chia sẻ trải nghiệm ẩm thực.</p>


        <div className={styles.buttonGroup}>
          <Link to="/kham-pha" className={styles.ctaButton}>
            Khám phá ngay
          </Link>
          <Link to="/dang-ky" className={styles.secondaryButton}>
            Đăng Ký
          </Link>
        </div>
      </div>

      {/* Các tính năng - đặt ở dưới cùng */}
      <div className={styles.features}>
        <div className={`${styles.featureItem} ${styles.featureLeft}`}>
          <FiStar /> Rating thật từ người dùng
        </div>
        <div className={`${styles.featureItem} ${styles.featureCenter}`}>
          <FiImage /> Hình ảnh món ăn thực tế
        </div>
        <div className={`${styles.featureItem} ${styles.featureRight}`}>
          <FiMap /> Bản đồ trực quan
        </div>
      </div>
    </main>
  );
};

export default HeroSection;