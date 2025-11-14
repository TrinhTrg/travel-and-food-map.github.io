  import React from 'react';
  import styles from './Footer.module.css';
  import { FaFacebookF, FaTwitter, FaInstagram, FaYoutube } from 'react-icons/fa';
  import logo from '../../assets/logo.png'; // Import logo
  import { NavLink } from 'react-router-dom';

  const Footer = () => {
    return (
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.firstColumn}>
            {/*1: Logo */}
            <div className={styles.logo}>
              <img src={logo} alt="FoodGo Logo" /> 
            </div>
            <p>
              Ứng dụng giao đồ ăn hàng đầu Việt Nam. Mang đến cho bạn những trải
              nghiệm ẩm thực tuyệt vời nhất.
            </p>
          {/*2: Icon mạng xã hội */}
            <div className={styles.socialIcons}>
              <a href="#"><FaFacebookF /></a>
              <a href="#"><FaTwitter /></a>
              <a href="#"><FaInstagram /></a>
              <a href="#"><FaYoutube /></a>
            </div>
          </div>
          
          <div className={styles.secondColumn}>
            <h4>Về FoodGo</h4>
            <ul>
              <li><NavLink to="/about">Giới thiệu</NavLink></li>
              <li><NavLink to="/story">Câu chuyện của chúng tôi</NavLink></li>
              <li><NavLink to="/careers">Nghề nghiệp</NavLink></li>
              <li><NavLink to="/news">Tin tức</NavLink></li>
              <li><NavLink to="/partners">Đối tác</NavLink></li>
            </ul>
          </div>

          <div className={styles.thirdColumn}>
            <h4>Hỗ trợ</h4>
            <ul>
              <li><NavLink to="/contact">Liên hệ</NavLink></li>
              <li><NavLink to="/help-center">Trung tâm trợ giúp</NavLink></li>
              <li><NavLink to="/faq">Câu hỏi thường gặp</NavLink></li>
              <li><NavLink to="/report">Báo cáo sự cố</NavLink></li>
              <li><NavLink to="/feedback">Phản hồi</NavLink></li>
            </ul>
          </div>

          <div className={styles.fourthColumn}>
            <h4>Chính sách</h4>
            <ul>
              <li><NavLink to="/privacy">Chính sách bảo mật</NavLink></li>
              <li><NavLink to="/terms">Điều khoản sử dụng</NavLink></li>
              <li><NavLink to="/refund">Chính sách hoàn tiền</NavLink></li>
              <li><NavLink to="/shipping">Chính sách giao hàng</NavLink></li>
              <li><NavLink to="/food-safety">Chính sách an toàn thực phẩm</NavLink></li>
            </ul>
          </div>
          </div>
          {/*3: Copyright và link phụ */}
          <div className={styles.bottomFooter}>
            <span className={styles.copyright}>
              © 2025 FoodGo. All rights reserved.
            </span>
            <div className={styles.subLinks}>
              <a href="/chinh-sach">Chính sách bảo mật</a>
              <a href="/dieu-khoan">Điều khoản</a>
              <a href="/cookies">Cookies</a>
            </div>
          </div>
      </footer>
    );
  };

  export default Footer;