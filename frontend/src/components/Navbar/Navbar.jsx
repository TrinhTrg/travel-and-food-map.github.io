import React, { useState, useRef, useEffect } from 'react';
// Import thư viện css module 
import styles from './Navbar.module.css';
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';
import { FaTachometerAlt } from 'react-icons/fa';
import LoginModal from '../LoginModal/LoginModal';
import WriteReviewModal from '../WriteReviewModal/WriteReviewModal';
import CollectionModal from '../CollectionModal/CollectionModal';
import { searchAPI } from '../../services/api';

// 1. TÁCH IMPORT ICON: Thêm import cho FiSearch
import { FaMapMarkerAlt, FaPlus, FaUser, FaComment, FaList, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa'; // Icon từ Font Awesome
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState({ restaurants: [], categories: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]); // Lịch sử keyword tìm kiếm
  const [recentRestaurants, setRecentRestaurants] = useState([]); // Nhà hàng đã xem gần đây (2-3 địa điểm)
  const [categories, setCategories] = useState([]); // Categories để hiển thị khi chưa có search
  const [showHistory, setShowHistory] = useState(false); // Hiển thị lịch sử khi click vào search bar
  const location = useLocation();
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const userMenuRef = useRef(null);
  const userButtonRef = useRef(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
  const mobileMenuRef = useRef(null);
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
        // Chỉ đóng search expanded trên mobile (≤480px)
        if (window.innerWidth <= 480) {
          setIsSearchExpanded(false);
        }
      }
      // Close mobile menu when clicking outside
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        !event.target.closest(`.${styles.mobileMenuButton}`)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isDropdownOpen || isUserMenuOpen || showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen, isUserMenuOpen, showSuggestions, isMobileMenuOpen]);

  // Tạo hoặc lấy session_id từ sessionStorage (cho anonymous users)
  const getOrCreateSessionId = () => {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  };

  // Load search history và fetch recent restaurants, categories
  useEffect(() => {
    // Load search history từ localStorage
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Error loading search history:', error);
      }
    }

    // Fetch recent restaurants (đã xem gần đây)
    const fetchRecentRestaurants = async () => {
      try {
        const sessionId = getOrCreateSessionId();
        const token = localStorage.getItem('token');
        const headers = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${API_BASE_URL}/restaurants?viewed_only=true&session_id=${sessionId}`, {
          headers
        });
        
        if (response.ok) {
          const data = await response.json();
          const restaurants = Array.isArray(data.data) ? data.data : [];
          // Giới hạn 2-3 địa điểm
          setRecentRestaurants(restaurants.slice(0, 3));
        }
      } catch (error) {
        console.error('Error fetching recent restaurants:', error);
      }
    };

    // Fetch categories để hiển thị khi chưa có search
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        if (response.ok) {
          const data = await response.json();
          setCategories(Array.isArray(data.data) ? data.data : []);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchRecentRestaurants();
    fetchCategories();
  }, [API_BASE_URL]);

  // Đọc search query từ URL và hiển thị trong search bar
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q) {
      setSearchQuery(q);
    }
  }, [location.search]);

  // Search autocomplete với debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchSuggestions({ restaurants: [], categories: [] });
      // Nếu không có query, không hiển thị suggestions nhưng có thể hiển thị history
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setIsSearching(true);
        const response = await searchAPI.autocomplete(searchQuery, 10);
        if (response.success) {
          setSearchSuggestions(response.data);
          setShowSuggestions(true);
          setShowHistory(false); // Ẩn history khi có suggestions
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
    // Nếu có query, hiển thị suggestions
    if (searchQuery.trim() && (searchSuggestions.restaurants.length > 0 || searchSuggestions.categories.length > 0)) {
      setShowSuggestions(true);
      setShowHistory(false);
    } else {
      // Nếu không có query, hiển thị lịch sử tìm kiếm và nhà hàng gần đây
      setShowHistory(true);
      setShowSuggestions(false);
    }
  };

  // Lưu search vào history
  const saveToHistory = (query) => {
    if (!query.trim()) return;
    
    const trimmedQuery = query.trim();
    setSearchHistory((prev) => {
      // Loại bỏ duplicate và giữ tối đa 10 items
      const newHistory = [trimmedQuery, ...prev.filter(item => item !== trimmedQuery)].slice(0, 10);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const query = searchQuery.trim();
      saveToHistory(query); // Lưu vào history
      navigate(`/kham-pha?q=${encodeURIComponent(query)}`);
      setShowSuggestions(false);
      setShowHistory(false);
      // KHÔNG xóa searchQuery để giữ keyword như Google Maps
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
    setShowHistory(false);
    // KHÔNG xóa searchQuery
  };

  const handleCategoryClick = (category) => {
    // Navigate với category name để search API có thể tìm theo tên
    const query = category.name;
    saveToHistory(query); // Lưu vào history
    navigate(`/kham-pha?q=${encodeURIComponent(query)}`);
    setSearchQuery(query); // Giữ keyword trong search bar
    setShowSuggestions(false);
    setShowHistory(false);
  };

  const handleHistoryItemClick = (historyItem) => {
    setSearchQuery(historyItem);
    navigate(`/kham-pha?q=${encodeURIComponent(historyItem)}`);
    setShowHistory(false);
    setShowSuggestions(false);
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
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
        <div 
          ref={searchRef} 
          className={`${styles.searchBarContainer} ${isSearchExpanded ? styles.searchExpanded : ''}`}
        >
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
          <button
            className={styles.searchIconButton}
            onClick={() => {
              setIsSearchExpanded(true);
              // Focus vào input sau khi expand
              setTimeout(() => {
                searchInputRef.current?.focus();
              }, 100);
            }}
            type="button"
          >
            <FiSearch />
          </button>

          {/* Search History Dropdown - hiển thị khi click vào search bar và không có query */}
          {showHistory && (
            <div className={styles.searchSuggestions}>
              {/* Nhà hàng đã xem gần đây (2-3 địa điểm) */}
              {recentRestaurants.length > 0 && (
                <div className={styles.suggestionSection}>
                  <div className={styles.suggestionHeader}>
                    <FiSearch className={styles.suggestionIcon} />
                    <span>Đã tìm kiếm gần đây</span>
                  </div>
                  {recentRestaurants.map((restaurant) => (
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

              {/* Keyword tìm kiếm gần đây */}
              {searchHistory.length > 0 && (
                <div className={styles.suggestionSection}>
                  <div className={styles.suggestionHeader}>
                    <FiSearch className={styles.suggestionIcon} />
                    <span>Từ khóa tìm kiếm</span>
                    {recentRestaurants.length === 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          clearSearchHistory();
                        }}
                        className={styles.clearHistoryButton}
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                  {searchHistory.map((item, index) => (
                    <div
                      key={index}
                      className={styles.suggestionItem}
                      onClick={() => handleHistoryItemClick(item)}
                    >
                      <FiSearch className={styles.suggestionIcon} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Nếu chưa có search history và recent restaurants - hiển thị categories */}
              {searchHistory.length === 0 && recentRestaurants.length === 0 && (
                <>
                  <div className={styles.suggestionSection}>
                    <div className={styles.suggestionHeader}>
                      <FiSearch className={styles.suggestionIcon} />
                      <span>Tìm kiếm theo danh mục</span>
                    </div>
                    {categories.length > 0 ? (
                      categories.slice(0, 8).map((category) => (
                        <div
                          key={category.id}
                          className={styles.suggestionItem}
                          onClick={() => handleCategoryClick(category)}
                        >
                          {category.name}
                        </div>
                      ))
                    ) : (
                      <div className={styles.noResults}>Đang tải danh mục...</div>
                    )}
                  </div>
                  <div className={styles.suggestionSection}>
                    <div className={styles.noResults}>Chưa có kết quả tìm kiếm</div>
                  </div>
                </>
              )}
            </div>
          )}

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

      {/* Mobile Menu Button */}
      <button
        className={styles.mobileMenuButton}
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        type="button"
        aria-label="Menu"
      >
        {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
      </button>

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

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className={styles.mobileMenuOverlay} onClick={() => setIsMobileMenuOpen(false)}>
          <div ref={mobileMenuRef} className={styles.mobileMenuDrawer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.mobileMenuHeader}>
              <h3>Menu</h3>
              <button
                className={styles.mobileMenuClose}
                onClick={() => setIsMobileMenuOpen(false)}
                type="button"
              >
                <FaTimes />
              </button>
            </div>

            <div className={styles.mobileMenuContent}>
              {/* Navigation Links */}
              <div className={styles.mobileMenuSection}>
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    `${styles.mobileMenuItem} ${isActive ? styles.mobileMenuItemActive : ''}`
                  }
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Home
                </NavLink>
                <NavLink
                  to="/kham-pha"
                  className={({ isActive }) =>
                    `${styles.mobileMenuItem} ${isActive ? styles.mobileMenuItemActive : ''}`
                  }
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Khám Phá
                </NavLink>
                <NavLink
                  to="/about-us"
                  className={({ isActive }) =>
                    `${styles.mobileMenuItem} ${isActive ? styles.mobileMenuItemActive : ''}`
                  }
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  About Us
                </NavLink>
                <NavLink
                  to="/contact"
                  className={({ isActive }) =>
                    `${styles.mobileMenuItem} ${isActive ? styles.mobileMenuItemActive : ''}`
                  }
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Contact
                </NavLink>
              </div>

              {/* Location Buttons */}
              <div className={styles.mobileMenuSection}>
                <button
                  className={`${styles.mobileMenuItem} ${isLocating ? styles.mobileMenuItemActive : ''}`}
                  onClick={() => {
                    handleLocateClick();
                    setIsMobileMenuOpen(false);
                  }}
                  type="button"
                >
                  <FaMapMarkerAlt />
                  {isLocating ? "Đang tìm vị trí..." : "Vị trí hiện tại"}
                </button>
                <button
                  className={styles.mobileMenuItem}
                  onClick={() => setIsMobileMenuOpen(false)}
                  type="button"
                >
                  <FaMapMarkerAlt />
                  Địa phương – Đà Nẵng
                </button>
              </div>

              {/* Add Button Actions */}
              <div className={styles.mobileMenuSection}>
                <button
                  className={styles.mobileMenuItem}
                  onClick={() => {
                    handleOptionClick('create-place');
                    setIsMobileMenuOpen(false);
                  }}
                  type="button"
                >
                  <FaPlus />
                  Tạo địa điểm
                </button>
                <button
                  className={styles.mobileMenuItem}
                  onClick={() => {
                    handleOptionClick('write-comment');
                    setIsMobileMenuOpen(false);
                  }}
                  type="button"
                >
                  <FaComment />
                  Viết bình luận
                </button>
                <button
                  className={styles.mobileMenuItem}
                  onClick={() => {
                    handleOptionClick('create-collection');
                    setIsMobileMenuOpen(false);
                  }}
                  type="button"
                >
                  <FaList />
                  Bộ sưu tập
                </button>
              </div>

              {/* User Section */}
              <div className={styles.mobileMenuSection}>
                {isAuthenticated ? (
                  <>
                    <button
                      className={styles.mobileMenuItem}
                      onClick={() => {
                        navigate('/ho-so');
                        setIsMobileMenuOpen(false);
                      }}
                      type="button"
                    >
                      <FaUser />
                      Hồ sơ
                    </button>
                    {isAdmin && (
                      <button
                        className={styles.mobileMenuItem}
                        onClick={() => {
                          navigate('/admin/dashboard');
                          setIsMobileMenuOpen(false);
                        }}
                        type="button"
                      >
                        <FaTachometerAlt />
                        Dashboard
                      </button>
                    )}
                    <button
                      className={`${styles.mobileMenuItem} ${styles.mobileMenuItemDanger}`}
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      type="button"
                    >
                      <FaSignOutAlt />
                      Đăng xuất
                    </button>
                  </>
                ) : (
                  <NavLink
                    to="/dang-nhap"
                    className={styles.mobileMenuItem}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <FaUser />
                    Đăng nhập
                  </NavLink>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;