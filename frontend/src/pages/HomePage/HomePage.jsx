import React from 'react';
import Navbar from '../../components/Navbar/Navbar';
import HeroSection from '../../components/HeroSection/HeroSection';
import Footer from '../../components/Footer/Footer';
import styles from './HomePage.module.css';
import { FiSearch, FiEye, FiEdit3 } from 'react-icons/fi';
import step1Animation from '../../assets/animations/step1-search.gif.gif';
import step2Animation from '../../assets/animations/step2-eye.gif.gif';
import step3Animation from '../../assets/animations/step3-share.gif.gif';

// Component để hiển thị animation (hỗ trợ cả GIF, MP4, và fallback icon)
const StepAnimation = ({ animationSrc, animationType = 'gif', Icon, alt }) => {
  // Nếu có file animation, sử dụng file đó
  if (animationSrc) {
    const isVideo = animationType === 'video' || 
                   (typeof animationSrc === 'string' && (animationSrc.endsWith('.mp4') || animationSrc.endsWith('.webm')));
    
    if (isVideo) {
      return (
        <video 
          className={styles.stepAnimation}
          autoPlay 
          loop 
          playsInline 
          muted
          aria-label={alt}
        >
          <source src={animationSrc} type="video/mp4" />
        </video>
      );
    } else {
      // GIF hoặc các format ảnh động khác
      return (
        <img 
          src={animationSrc} 
          alt={alt}
          className={styles.stepAnimation}
        />
      );
    }
  }
  
  // Fallback: sử dụng icon nếu chưa có animation
  return <Icon className={styles.stepIcon} />;
};

const HomePage = () => {
  return (
    <div className={styles.pageContainer}>
      <Navbar />
      <HeroSection />
      
      {/* Section How It Works */}
      <section className={styles.howItWorksSection}>
        <div className={styles.howItWorksContent}>
          <h1 className={styles.howItWorksTitle}>
            Nó hoạt động <span>như thế nào?</span>
          </h1>
          <p className={styles.howItWorksSubtitle}>
            Khám phá, trải nghiệm và chia sẻ ẩm thực chưa bao giờ dễ dàng hơn thế.
            Chỉ với 3 bước đơn giản!
          </p>
        </div>

        {/* Step 1: Text Left, Icon Right */}
        <div className={`${styles.stepSection} ${styles.stepSection1}`}>
          <div className={styles.stepContainer}>
            <div className={styles.stepContent}>
              <div className={styles.stepNumber}>01</div>
              <h2 className={styles.stepTitle}>Khám Phá</h2>
              <p className={styles.stepDescription}>
                Sử dụng thanh tìm kiếm thông minh hoặc bản đồ trực quan để
                tìm thấy chính xác món ăn, nhà hàng, hoặc xu hướng ẩm thực
                quanh bạn.
              </p>
            </div>
            <div className={styles.stepVisual}>
              <StepAnimation 
                animationSrc={step1Animation} // Thay bằng: step1Animation khi đã có file
                animationType="gif"
                Icon={FiSearch}
                alt="Animation tìm kiếm địa điểm"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Icon Left, Text Right */}
        <div className={`${styles.stepSection} ${styles.stepSection2}`}>
          <div className={styles.stepContainer}>
            <div className={styles.stepContent}>
              <div className={styles.stepNumber}>02</div>
              <h2 className={styles.stepTitle}>Xem Đánh Giá</h2>
              <p className={styles.stepDescription}>
                Đọc hàng ngàn đánh giá có tâm, xem hình ảnh món ăn thực tế
                do cộng đồng chụp để có quyết định khách quan nhất
                trước khi đi.
              </p>
            </div>
            <div className={styles.stepVisual}>
              <StepAnimation 
                animationSrc={step2Animation}
                animationType="gif"
                Icon={FiEye}
                alt="Animation xem đánh giá"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Text Left, Icon Right */}
        <div className={`${styles.stepSection} ${styles.stepSection3}`}>
          <div className={styles.stepContainer}>
            <div className={styles.stepContent}>
              <div className={styles.stepNumber}>03</div>
              <h2 className={styles.stepTitle}>Chia Sẻ</h2>
              <p className={styles.stepDescription}>
                Đăng tải trải nghiệm của bạn! Viết review, chấm điểm,
                upload ảnh món ăn của bạn để giúp đỡ cộng đồng và
                trở thành một "reviewer" uy tín.
              </p>
            </div>
            <div className={styles.stepVisual}>
              <StepAnimation 
                animationSrc={step3Animation} // Thay bằng: step3Animation khi đã có file
                animationType="gif"
                Icon={FiEdit3}
                alt="Animation chia sẻ đánh giá"
              />
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default HomePage;