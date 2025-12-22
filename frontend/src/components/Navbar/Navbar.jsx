import React, { useState, useRef, useEffect } from 'react';
// Import thư viện css module 
import styles from './Navbar.module.css';
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';
import { FaTachometerAlt } from 'react-icons/fa';
import LoginModal from '../LoginModal/LoginModal';
import WriteReviewModal from '../WriteReviewModal/WriteReviewModal';
import CollectionModal from '../CollectionModal/CollectionModal';
import { searchAPI } from '../../services/api';

// 1. TÁCH IMPORT ICON: Thêm import cho FiSearch
import { FaMapMarkerAlt, FaPlus, FaUser, FaComment, FaList, FaSignOutAlt } from 'react-icons/fa'; // Icon từ Font Awesome
import { FiSearch } from 'react-icons/fi'; // Icon từ Feather Icons

import imglogo from '../../assets/logo.png'; // Import logo

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isWriteReviewModalOpen, setIsWriteReviewModalOpen] = useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState({ restaurants: [], categories: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const userMenuRef = useRef(null);
  const userButtonRef = useRef(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
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
      // Close search suggestions when clicking outside
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    if (isDropdownOpen || isUserMenuOpen || showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen, isUserMenuOpen, showSuggestions]);

  // Search autocomplete với debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchSuggestions({ restaurants: [], categories: [] });
      setShowSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setIsSearching(true);
        const response = await searchAPI.autocomplete(searchQuery, 10);
        if (response.success) {
          setSearchSuggestions(response.data);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error('Search error:', error);
        setSearchSuggestions({ restaurants: [], categories: [] });
      } finally {
        setIsSearching(false);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleOptionClick = (action) => {
    setIsDropdownOpen(false);

    // Đóng popup restaurant nếu đang mở
    window.dispatchEvent(new CustomEvent('app:close-restaurant-popup'));

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
      // Mở modal tìm kiếm địa điểm để viết bình luận
      setIsWriteReviewModalOpen(true);
      return;
    }

    if (action === 'create-collection') {
      // Mở modal Bộ sưu tập
      setIsCollectionModalOpen(true);
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

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchFocus = () => {
    if (searchQuery.trim() && (searchSuggestions.restaurants.length > 0 || searchSuggestions.categories.length > 0)) {
      setShowSuggestions(true);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/kham-pha?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
      setSearchQuery('');
    }
  };

  const handleSuggestionClick = (restaurant) => {
    // Dispatch event để zoom map vào restaurant (nếu đang ở DiscoverPage)
    if (restaurant.latitude && restaurant.longitude) {
      window.dispatchEvent(
        new CustomEvent('app:center-map-restaurant', {
          detail: {
            latitude: restaurant.latitude,
            longitude: restaurant.longitude,
            restaurantId: restaurant.id,
          },
        })
      );
    }

    // Navigate đến DiscoverPage với restaurant id
    navigate(`/kham-pha?restaurant=${restaurant.id}`);
    setShowSuggestions(false);
    setSearchQuery('');
  };

  const handleCategoryClick = (category) => {
    navigate(`/kham-pha?category=${category.id}`);
    setShowSuggestions(false);
    setSearchQuery('');
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
        <div ref={searchRef} className={styles.searchBarContainer}>
          <form className={styles.searchBar} onSubmit={handleSearchSubmit}>
            <FiSearch />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Tìm kiếm địa điểm, món ăn..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
            />
          </form>

          {/* Suggestions Dropdown */}
          {showSuggestions && (
            <div className={styles.searchSuggestions}>
              {/* Categories Section */}
              {searchSuggestions.categories.length > 0 && (
                <div className={styles.suggestionSection}>
                  <div className={styles.suggestionHeader}>
                    <FiSearch className={styles.suggestionIcon} />
                    <span>Tìm theo danh mục</span>
                  </div>
                  {searchSuggestions.categories.map((category) => (
                    <div
                      key={category.id}
                      className={styles.suggestionItem}
                      onClick={() => handleCategoryClick(category)}
                    >
                      {category.name}
                    </div>
                  ))}
                </div>
              )}

              {/* Restaurants Section */}
              {searchSuggestions.restaurants.length > 0 && (
                <div className={styles.suggestionSection}>
                  {searchSuggestions.categories.length === 0 && (
                    <div className={styles.suggestionHeader}>
                      <FiSearch className={styles.suggestionIcon} />
                      <span>Kết quả tìm kiếm</span>
                    </div>
                  )}
                  {searchSuggestions.restaurants.map((restaurant) => (
                    <div
                      key={restaurant.id}
                      className={styles.suggestionItem}
                      onClick={() => handleSuggestionClick(restaurant)}
                    >
                      <div className={styles.suggestionItemContent}>
                        {restaurant.image && (
                          <img
                            src={restaurant.image}
                            alt={restaurant.name}
                            className={styles.suggestionImage}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        <div className={styles.suggestionText}>
                          <div className={styles.suggestionTitle}>{restaurant.name}</div>
                          {restaurant.address && (
                            <div className={styles.suggestionSubtitle}>{restaurant.address}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* No results */}
              {searchSuggestions.restaurants.length === 0 &&
                searchSuggestions.categories.length === 0 &&
                !isSearching && (
                  <div className={styles.suggestionSection}>
                    <div className={styles.noResults}>Không tìm thấy kết quả</div>
                  </div>
                )}

              {/* Loading */}
              {isSearching && (
                <div className={styles.suggestionSection}>
                  <div className={styles.loadingText}>Đang tìm kiếm...</div>
                </div>
              )}
            </div>
          )}
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
            to="/about-us"
            className={({ isActive }) =>
              isActive ? styles.active : undefined
            }
          >
            About Us
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
                    <div className={styles.optionTitle}>Bộ sưu tập</div>
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
                      navigate('/ho-so');
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

      {/* Write Review Modal */}
      <WriteReviewModal
        isOpen={isWriteReviewModalOpen}
        onClose={() => setIsWriteReviewModalOpen(false)}
      />

      {/* Collection Modal */}
      <CollectionModal
        isOpen={isCollectionModalOpen}
        onClose={() => setIsCollectionModalOpen(false)}
      />
    </nav>
  );
};

export default Navbar;