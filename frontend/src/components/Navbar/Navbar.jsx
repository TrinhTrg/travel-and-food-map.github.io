import React, { useState, useRef, useEffect } from 'react';
// Import thư viện css module 
import styles from './Navbar.module.css';
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';
import { FaTachometerAlt } from 'react-icons/fa';
import LoginModal from '../LoginModal/LoginModal';

// 1. TÁCH IMPORT ICON: Thêm import cho FiSearch
import { FaMapMarkerAlt, FaPlus, FaUser, FaComment, FaList, FaSignOutAlt } from 'react-icons/fa'; // Icon từ Font Awesome
import { FiSearch } from 'react-icons/fi'; // Icon từ Feather Icons

import imglogo from '../../assets/logo.png'; // Import logo

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const userMenuRef = useRef(null);
  const userButtonRef = useRef(null);
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
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
    if (action === 'create-place') {
      navigate('/create-location');
      return;
    }

    if (action === 'write-comment') {
      navigate('/kham-pha');
      return;
    }
  };

  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
    navigate('/');
  };

  const handleLocateClick = () => {
    if (isLocating) return;

    if (!navigator.geolocation) {
      setLocationError("Thiết bị của bạn không hỗ trợ định vị.");
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const detail = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        window.dispatchEvent(new CustomEvent("app:center-map-user", { detail }));
      },
      (error) => {
        console.error("Không thể lấy vị trí hiện tại:", error);
        setIsLocating(false);
        setLocationError("Không thể lấy vị trí hiện tại. Vui lòng thử lại.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
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
        <button
          className={`${styles.iconButton} ${isLocating ? styles.iconButtonActive : ""}`}
          onClick={handleLocateClick}
          type="button"
        >
          <FaMapMarkerAlt />
          {isLocating ? "Đang tìm vị trí..." : "Vị trí hiện tại"}
        </button>
        <button className={`${styles.iconButton} ${styles.localeButton}`}>
          <FaMapMarkerAlt /> Địa phương – Đà Nẵng
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
              <span>{user?.name || user?.email}</span>
            </button>
            {isUserMenuOpen && (
              <div ref={userMenuRef} className={styles.userMenu}>
                <div className={styles.userInfo}>
                  <FaUser className={styles.userIcon} />
                  <div>
                    <div className={styles.userName}>{user?.name || user?.username}</div>
                    <div className={styles.userEmail}>{user?.email || 'Tài khoản của bạn'}</div>
                  </div>
                </div>
                <div className={styles.userMenuItems}>
                  <button 
                    className={styles.userMenuItem} 
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      
                    }}
                  >
                    <FaUser />
                    Hồ sơ
                  </button>
                  {isAdmin && (
                    <button 
                      className={styles.userMenuItem} 
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        navigate('/admin/dashboard');
                      }}
                    >
                      <FaTachometerAlt />
                      Dashboard
                    </button>
                  )}
                  <button className={styles.userMenuItem} onClick={handleLogout}>
                    <FaSignOutAlt />
                    Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <NavLink to="/dang-nhap" className={styles.iconButton}>
            <FaUser /> Đăng nhập
          </NavLink>
        )}
      </div>

      {locationError && (
        <div className={styles.locationError} role="alert">
          {locationError}
        </div>
      )}
      
      {/* Login Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </nav>
  );
};

export default Navbar;