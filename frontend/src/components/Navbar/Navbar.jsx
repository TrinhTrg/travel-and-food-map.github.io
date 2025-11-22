import React, { useState, useRef, useEffect } from 'react';
// Import thư viện css module 
import styles from './Navbar.module.css';
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';
import LoginModal from '../LoginModal/LoginModal';

// 1. TÁCH IMPORT ICON: Thêm import cho FiSearch
import { FaMapMarkerAlt, FaPlus, FaUser, FaComment, FaList, FaSignOutAlt } from 'react-icons/fa'; // Icon từ Font Awesome
import { FiSearch } from 'react-icons/fi'; // Icon từ Feather Icons

import imglogo from '../../assets/logo.png'; // Import logo

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const userMenuRef = useRef(null);
  const userButtonRef = useRef(null);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
      if (
        userMenuRef.current &&
        userButtonRef.current &&
        !userMenuRef.current.contains(event.target) &&
        !userButtonRef.current.contains(event.target)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    if (isDropdownOpen || isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen, isUserMenuOpen]);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleOptionClick = (action) => {
    setIsDropdownOpen(false);
    
    // Kiểm tra nếu user chưa đăng nhập thì hiển thị modal
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }
    
    // Nếu đã đăng nhập thì thực hiện action
    console.log(`Selected: ${action}`);
    // Có thể thêm logic xử lý cho từng option ở đây
    // Ví dụ: navigate đến trang tạo địa điểm, v.v.
  };

  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
    navigate('/');
  };

  return (
    <nav className={styles.navbar}>

      {/* 2. BỌC LOGO VÀ SEARCH BAR VÀO .navLeft */}
      <div className={styles.navLeft}>
        
        {/* Logo của bạn */}
        <div className={styles.logo}>
          <NavLink to="/">
            <img src={imglogo} alt="FoodGo Logo" />
          </NavLink>
        </div>

        {/* Thanh tìm kiếm */}
        <div className={styles.searchBar}>
          <FiSearch />
          <input type="text" placeholder="Tìm kiếm địa điểm, món ăn..." />
        </div>
      </div>
      
      {/* 2: Các link điều hướng (Giữ nguyên code NavLink của bạn) */}
      <ul className={styles.navLinks}>
        <li>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? styles.active : undefined
            }
          >
            Home
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/kham-pha"
            className={({ isActive }) =>
              isActive ? styles.active : undefined
            }
          >
            Khám Phá
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/how-it-works"
            className={({ isActive }) =>
              isActive ? styles.active : undefined
            }
          >
            How It Works
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/contact"
            className={({ isActive }) =>
              isActive ? styles.active : undefined
            }
          >
            Contact
          </NavLink>
        </li>
      </ul>

      {/* 3: Các nút hành động */}
      <div className={styles.actions}>
        <button className={styles.iconButton}>
          <FaMapMarkerAlt /> Vị trí hiện tại
        </button>
        <div className={styles.dropdownContainer}>
          <button 
            ref={buttonRef}
            className={styles.iconButtonOrange}
            onClick={toggleDropdown}
          >
            <FaPlus />
          </button>
          {isDropdownOpen && (
            <div ref={dropdownRef} className={styles.dropdownMenu}>
              <div className={styles.dropdownHeader}>
                <strong>Bạn có thể</strong>
              </div>
              <div className={styles.dropdownOptions}>
                <div 
                  className={styles.dropdownOption}
                  onClick={() => handleOptionClick('create-place')}
                >
                  <FaMapMarkerAlt className={styles.optionIcon} />
                  <div className={styles.optionContent}>
                    <div className={styles.optionTitle}>Tạo địa điểm</div>
                    <div className={styles.optionSubtext}>Sẽ được duyệt trong vòng 48 tiếng</div>
                  </div>
                </div>
                <div 
                  className={styles.dropdownOption}
                  onClick={() => handleOptionClick('write-comment')}
                >
                  <FaComment className={styles.optionIcon} />
                  <div className={styles.optionContent}>
                    <div className={styles.optionTitle}>Viết bình luận</div>
                    <div className={styles.optionSubtext}>Để chia sẻ trải nghiệm cho cộng đồng</div>
                  </div>
                </div>
                <div 
                  className={styles.dropdownOption}
                  onClick={() => handleOptionClick('create-collection')}
                >
                  <FaList className={styles.optionIcon} />
                  <div className={styles.optionContent}>
                    <div className={styles.optionTitle}>Tạo bộ sưu tập</div>
                    <div className={styles.optionSubtext}>Để lưu trữ địa điểm của bạn</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        {isAuthenticated ? (
          <div className={styles.userMenuContainer}>
            <button
              ref={userButtonRef}
              className={styles.userButton}
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            >
              <FaUser />
              <span>{user?.username}</span>
            </button>
            {isUserMenuOpen && (
              <div ref={userMenuRef} className={styles.userMenu}>
                <div className={styles.userInfo}>
                  <FaUser className={styles.userIcon} />
                  <div>
                    <div className={styles.userName}>{user?.username}</div>
                    <div className={styles.userEmail}>Tài khoản của bạn</div>
                  </div>
                </div>
                <button className={styles.logoutButton} onClick={handleLogout}>
                  <FaSignOutAlt />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        ) : (
          <NavLink to="/dang-nhap" className={styles.iconButton}>
            <FaUser /> Đăng nhập
          </NavLink>
        )}
      </div>
      
      {/* Login Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </nav>
  );
};

export default Navbar;