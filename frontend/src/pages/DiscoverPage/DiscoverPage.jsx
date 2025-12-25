import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import styles from './DiscoverPage.module.css';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import RestaurantCard from '../../components/RestaurantCard/RestaurantCard';
import TopRestaurantCard from '../../components/TopRestaurantCard/TopRestaurantCard';
import {
  FaFire,
  FaStar,
  FaArrowLeft,
  FaMapMarkerAlt,
} from 'react-icons/fa';
import { FiFilter } from 'react-icons/fi';
import MapView from "../../components/Map/MapView";

const DEFAULT_CITY_CENTER = { lat: 16.0544, lng: 108.2022 };

const FILTERS = [
  {
    key: 'popular',
    label: 'Phổ biến',
    Icon: FaFire,
    sortFn: (a, b) => b.reviews - a.reviews,
  },
  {
    key: 'topRated',
    label: 'Đánh giá cao',
    Icon: FaStar,
    sortFn: (a, b) => b.rating - a.rating,
  },
];

const ADVANCED_FILTERS = [
  {
    key: 'distance',
    label: 'Gần bạn',
  },
  {
    key: 'price',
    label: 'Giá tối đa',
  },
];

const priceLabelToScore = (price) => {
  if (!price) return 2;
  if (typeof price === 'number') return price;
  const matches = `${price}`.match(/\$/g);
  return matches ? matches.length : 2;
};

const parseCoordinate = (value) => {
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toRad = (deg) => (deg * Math.PI) / 180;

const haversineDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const distanceFromPoint = (baseLat, baseLng, restaurant) => {
  const lat = parseCoordinate(restaurant.latitude);
  const lng = parseCoordinate(restaurant.longitude);
  if (lat === null || lng === null || baseLat == null || baseLng == null) {
    return Number.MAX_VALUE;
  }
  return haversineDistanceKm(baseLat, baseLng, lat, lng);
};
  
const DiscoverPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // --- GIỮ NGUYÊN LOGIC CŨ ---
  const [activeFilter, setActiveFilter] = useState(FILTERS[0].key);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);
  const [restaurants, setRestaurants] = useState([]); // Restaurants cho section "Nhà hàng gần bạn" (có thể bị filter bởi search)
  const [allRestaurants, setAllRestaurants] = useState([]); // Tất cả restaurants (không bị ảnh hưởng bởi search) - dùng cho Top Rated và All
  const [userPosition, setUserPosition] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- THÊM STATE MỚI CHO UI ---
  // viewMode: 'overview' | 'nearby' | 'topRated' | 'all'
  const [viewMode, setViewMode] = useState('overview');
  const [advancedFilters, setAdvancedFilters] = useState([]);
  const [maxPrice, setMaxPrice] = useState(10000000);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const filterDropdownRef = useRef(null);

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

  // Tạo hoặc lấy session_id từ sessionStorage (cho anonymous users)
  const getOrCreateSessionId = () => {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  };

  // Luôn scroll window lên top khi component mount hoặc searchParams thay đổi
  // Scroll trong popup là riêng biệt và không ảnh hưởng đến window scroll
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [searchParams]); // Chạy mỗi khi searchParams thay đổi

  // Đóng dropdown khi click ra ngoài
  // Lấy vị trí hiện tại của user cho filter "Gần bạn"
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        // Nếu không lấy được vị trí, fallback về tâm Đà Nẵng
        setUserPosition({ ...DEFAULT_CITY_CENTER });
      }
    );
  }, []);

  useEffect(() => {
    if (!isFilterDropdownOpen) return;

    const handleClickOutside = (event) => {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target)
      ) {
        setIsFilterDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFilterDropdownOpen]);

  // Fetch tất cả restaurants một lần (không bị ảnh hưởng bởi search) - dùng cho Top Rated và All
  useEffect(() => {
    const controller = new AbortController();
    const fetchAllRestaurants = async () => {
      try {
        const restaurantRes = await fetch(`${API_BASE_URL}/restaurants`, { signal: controller.signal });
        if (!restaurantRes.ok) throw new Error('Không thể lấy danh sách nhà hàng');
        const restaurantJson = await restaurantRes.json();
        const restaurantData = Array.isArray(restaurantJson.data) ? restaurantJson.data : [];
        setAllRestaurants(restaurantData);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error fetching all restaurants:', err);
        }
      }
    };
    fetchAllRestaurants();
    return () => controller.abort();
  }, [API_BASE_URL]);

  // Fetch data dựa trên search params hoặc viewed restaurants (chỉ cho section "Nhà hàng gần bạn")
  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      try {
        setLoading(true);
        const searchQuery = searchParams.get('q');
        const categoryId = searchParams.get('category');

        // Fetch categories luôn
        const categoryRes = await fetch(`${API_BASE_URL}/categories`, { signal: controller.signal });
        if (!categoryRes.ok) throw new Error('Không thể lấy danh sách categories');
        const categoryJson = await categoryRes.json();
        setCategories(Array.isArray(categoryJson.data) ? categoryJson.data : []);

        // Fetch restaurants dựa trên search hoặc category
        let restaurantRes;
        if (searchQuery || categoryId) {
          // Có search query hoặc category - gọi search API
          const searchParamsObj = new URLSearchParams();
          if (searchQuery) {
            searchParamsObj.append('q', searchQuery);
            // Thử search theo category name
            searchParamsObj.append('category_name', searchQuery);
          }
          if (categoryId) {
            searchParamsObj.append('category_id', categoryId);
          }
          restaurantRes = await fetch(`${API_BASE_URL}/search?${searchParamsObj.toString()}`, { signal: controller.signal });
        } else {
          // Không có search - lấy tất cả restaurants (sẽ sort theo khoảng cách và reviews sau)
          restaurantRes = await fetch(`${API_BASE_URL}/restaurants`, { signal: controller.signal });
        }

        if (!restaurantRes.ok) throw new Error('Không thể lấy danh sách nhà hàng');
        const restaurantJson = await restaurantRes.json();
        const restaurantData = Array.isArray(restaurantJson.data) ? restaurantJson.data : [];

        setRestaurants(restaurantData);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error(err);
          setError(err.message || 'Đã có lỗi xảy ra');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    return () => controller.abort();
  }, [searchParams, API_BASE_URL]);

  // Xử lý query parameter restaurant từ URL
  useEffect(() => {
    const restaurantId = searchParams.get('restaurant');
    if (restaurantId) {
      setSelectedRestaurantId(restaurantId);
      // Xóa query param sau khi đã set
      searchParams.delete('restaurant');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Track restaurant view khi user click vào restaurant
  useEffect(() => {
    if (!selectedRestaurantId) return;

    const trackView = async () => {
      try {
        const sessionId = getOrCreateSessionId();
        const token = localStorage.getItem('token');
        const headers = {
          'Content-Type': 'application/json'
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        await fetch(`${API_BASE_URL}/restaurants/${selectedRestaurantId}/view`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ session_id: sessionId })
        });
      } catch (err) {
        console.error('Error tracking view:', err);
      }
    };

    trackView();
  }, [selectedRestaurantId, API_BASE_URL]);

  // Fetch restaurant detail nếu không có trong list
  useEffect(() => {
    if (!selectedRestaurantId || loading || restaurants.length === 0) {
      return;
    }

    // Kiểm tra xem restaurant đã có trong list chưa (so sánh cả string và number)
    const restaurantExists = restaurants.some(
      (r) => String(r.id) === String(selectedRestaurantId) || r.id === selectedRestaurantId
    );

    // Nếu không có, fetch từ API
    if (!restaurantExists) {
      const fetchRestaurantDetail = async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/restaurants/${selectedRestaurantId}`);
          if (!res.ok) {
            console.error('Không thể lấy thông tin nhà hàng');
            return;
          }

          const json = await res.json();
          if (json.success && json.data) {
            // API trả về data với format khác một chút, cần format lại
            const restaurantData = json.data;

            // Format lại để phù hợp với format từ getAllRestaurants
            const formattedRestaurant = {
              id: restaurantData.id,
              name: restaurantData.name,
              image: restaurantData.image,
              bannerImage: restaurantData.bannerImage || restaurantData.image,
              rating: restaurantData.rating || 0,
              reviews: restaurantData.reviews || 0,
              address: restaurantData.address,
              // Sử dụng openStatus từ API (Đang mở cửa / Đã đóng cửa)
              openStatus: restaurantData.openStatus || (restaurantData.isOpen ? 'Đang mở cửa' : 'Đã đóng cửa'),
              status: restaurantData.openStatus || (restaurantData.isOpen ? 'Đang mở cửa' : 'Đã đóng cửa'), // Giữ để backward compatibility
              isOpen: restaurantData.isOpen !== undefined ? restaurantData.isOpen : true,
              tags: Array.isArray(restaurantData.tags) ? restaurantData.tags : [],
              category: restaurantData.category || 'Khác',
              description: restaurantData.description || 'Thông tin đang được cập nhật.',
              price: restaurantData.price || '$$',
              latitude: parseCoordinate(restaurantData.latitude),
              longitude: parseCoordinate(restaurantData.longitude),
              // Thêm các field mới
              phone_number: restaurantData.phone_number,
              website: restaurantData.website,
              opening_hours: restaurantData.opening_hours,
              owner_id: restaurantData.owner_id,
              categories: restaurantData.categories || [],
            };

            // Thêm restaurant vào list
            setRestaurants((prev) => {
              // Kiểm tra lại để tránh duplicate (so sánh cả string và number)
              const exists = prev.some(
                (r) => String(r.id) === String(formattedRestaurant.id) || r.id === formattedRestaurant.id
              );
              if (exists) return prev;
              return [...prev, formattedRestaurant];
            });
          }
        } catch (err) {
          console.error('Error fetching restaurant detail:', err);
        }
      };

      fetchRestaurantDetail();
    }
  }, [selectedRestaurantId, restaurants, loading, API_BASE_URL]);

  // Lắng nghe event để ping map đến restaurant location
  useEffect(() => {
    const handleCenterOnRestaurant = (event) => {
      const { restaurantId } = event.detail || {};
      if (restaurantId) {
        setSelectedRestaurantId(restaurantId);
      }
    };

    window.addEventListener('app:center-map-restaurant', handleCenterOnRestaurant);
    return () => {
      window.removeEventListener('app:center-map-restaurant', handleCenterOnRestaurant);
    };
  }, []);

  // Logic cho "Nhà hàng gần bạn": hiển thị địa điểm gần user và có nhiều reviews
  const restaurantsForNearby = useMemo(() => {
    // Nếu có search/category, dùng restaurants từ search
    // Nếu không có search, dùng allRestaurants
    const searchQuery = searchParams.get('q');
    const categoryId = searchParams.get('category');
    return (searchQuery || categoryId) ? restaurants : allRestaurants;
  }, [restaurants, allRestaurants, searchParams]);

  const filteredNearbyRestaurants = useMemo(() => {
    const currentFilter = FILTERS.find((filter) => filter.key === activeFilter);
    if (!currentFilter) return restaurantsForNearby;
    return [...restaurantsForNearby].sort(currentFilter.sortFn);
  }, [activeFilter, restaurantsForNearby]);

  const sortedNearbyRestaurants = useMemo(() => {
    let list = filteredNearbyRestaurants.map((restaurant) => {
      // Gắn thêm khoảng cách từ user để dùng cho sort + hiển thị
      const distanceKm = userPosition
        ? distanceFromPoint(
          userPosition.lat,
          userPosition.lng,
          restaurant
        )
        : null;
      return { ...restaurant, distanceKm };
    });

    const hasDistance = advancedFilters.includes('distance');
    const hasPrice = advancedFilters.includes('price');

    // Nếu chọn lọc theo giá, sắp xếp theo mức giá (cao -> thấp)
    if (hasPrice) {
      list = list.sort(
        (a, b) => priceLabelToScore(b.price) - priceLabelToScore(a.price)
      );
    }

    // Nếu chọn lọc theo khoảng cách, ưu tiên gần hơn
    if (hasDistance) {
      list = list.sort(
        (a, b) => (a.distanceKm ?? Number.MAX_VALUE) - (b.distanceKm ?? Number.MAX_VALUE)
      );
    } else {
      // Mặc định: sắp xếp theo khoảng cách gần + nhiều reviews
      // Ưu tiên gần hơn, nhưng nếu khoảng cách tương đương thì ưu tiên nhiều reviews hơn
      list = list.sort((a, b) => {
        const distA = a.distanceKm ?? Number.MAX_VALUE;
        const distB = b.distanceKm ?? Number.MAX_VALUE;
        
        // Nếu khoảng cách chênh lệch < 5km, ưu tiên reviews nhiều hơn
        if (Math.abs(distA - distB) < 5) {
          return (b.reviews || 0) - (a.reviews || 0);
        }
        // Nếu khoảng cách chênh lệch lớn, ưu tiên gần hơn
        return distA - distB;
      });
    }

    return list;
  }, [filteredNearbyRestaurants, advancedFilters, userPosition]);

  // Map hiển thị restaurants: nếu có search/category thì hiển thị kết quả search, không thì hiển thị tất cả
  const mapRestaurants = useMemo(() => {
    const searchQuery = searchParams.get('q');
    const categoryId = searchParams.get('category');
    return (searchQuery || categoryId) ? restaurants : allRestaurants;
  }, [restaurants, allRestaurants, searchParams]);

  // Top restaurants - chỉ lấy 10 nhà hàng được đánh giá cao nhất
  const topRestaurants = useMemo(() => {
    return [...allRestaurants]
      .sort((a, b) => {
        // Sắp xếp theo rating cao nhất
        if (b.rating === a.rating) {
          // Nếu rating bằng nhau, ưu tiên nhiều reviews hơn
          return (b.reviews || 0) - (a.reviews || 0);
        }
        return b.rating - a.rating;
      })
      .slice(0, 10) // Chỉ lấy 10 nhà hàng đầu tiên
      .map((restaurant, index) => ({
        ...restaurant,
        rank: index + 1,
        image: restaurant.image || restaurant.image_url || restaurant.bannerImage,
        price: restaurant.price || '$$',
      }));
  }, [allRestaurants]);

  const handleRestaurantSelect = (restaurantOrId) => {
    if (!restaurantOrId) {
      setSelectedRestaurantId(null);
      return;
    }
    const id = typeof restaurantOrId === "string" ? restaurantOrId : restaurantOrId.id;
    setSelectedRestaurantId(id);
  };

  const renderRestaurantList = (list) =>
    list.map((restaurant) => (
      <RestaurantCard
        key={restaurant.id}
        restaurant={restaurant}
        onSelect={handleRestaurantSelect}
        isActive={selectedRestaurantId === restaurant.id}
      />
    ));

  // --- UI HELPER FUNCTIONS ---

  // Component Nút Quay lại
  const BackButton = () => (
    <button
      className={styles.backButton}
      onClick={() => setViewMode('overview')}
    >
      <FaArrowLeft /> Quay lại
    </button>
  );

  // Component Header của Section (có nút Xem tất cả)
  const SectionHeader = ({ title, targetMode }) => (
    <div className={styles.sectionHeader}>
      <h2 className={styles.title}>{title}</h2>
      <button
        className={styles.viewAllLink}
        onClick={() => setViewMode(targetMode)}
      >
        Xem tất cả
      </button>
    </div>
  );

  const FilterDropdown = () => (
    <div className={styles.filterToggleWrapper} ref={filterDropdownRef}>
      <button
        type="button"
        className={`${styles.filterToggleButton} ${isFilterDropdownOpen ? styles.filterToggleButtonActive : ''
          }`}
        onClick={() => setIsFilterDropdownOpen((open) => !open)}
        aria-haspopup="true"
        aria-expanded={isFilterDropdownOpen}
        aria-label="Bộ lọc nâng cao"
      >
        <FiFilter />
      </button>

      {isFilterDropdownOpen && (
        <div className={styles.filterDropdown}>
          {ADVANCED_FILTERS.map(({ key, label }) => {
            const checked = advancedFilters.includes(key);
            const isPrice = key === 'price';
            return (
              <div key={key} className={styles.filterOption}>
                <button
                  type="button"
                  className={styles.filterOptionButton}
                  onClick={() => {
                    setAdvancedFilters((prev) =>
                      checked
                        ? prev.filter((item) => item !== key)
                        : [...prev, key]
                    );
                  }}
                >
                  <span
                    className={`${styles.filterCheckbox} ${checked ? styles.filterCheckboxChecked : ''
                      }`}
                  >
                    {checked && <span className={styles.filterCheckboxDot} />}
                  </span>
                  <span className={styles.filterLabel}>{label}</span>
                </button>
                {isPrice && (
                  <div className={styles.filterSliderRow}>
                    <input
                      type="range"
                      min={0}
                      max={10000000}
                      step={500000}
                      value={maxPrice}
                      onChange={(event) =>
                        setMaxPrice(Number(event.target.value))
                      }
                      className={styles.filterSlider}
                    />
                    <span className={styles.filterPriceValue}>
                      {maxPrice.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <Navbar />
        <main className={styles.mainContent}>
          <div className={styles.sidebar}><p>Đang tải dữ liệu...</p></div>
          <section className={styles.mapContainer}><div className={styles.mapPlaceholder}>Loading map...</div></section>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.pageContainer}>
        <Navbar />
        <main className={styles.mainContent}>
          <div className={styles.sidebar}>
            <p className={styles.errorText}>{error}</p>
            <button className={styles.retryButton} onClick={() => window.location.reload()}>Thử lại</button>
          </div>
          <section className={styles.mapContainer}><div className={styles.mapPlaceholder}>Không thể tải bản đồ</div></section>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <Navbar />

      <main className={styles.mainContent}>
        {/* Cột 1: Sidebar danh sách */}
        <aside className={styles.sidebar}>

          {/* --- VIEW: TỔNG QUAN (OVERVIEW) --- */}
          {viewMode === 'overview' && (
            <>
              {/* Section 1: Nhà hàng gần bạn */}
              <section className={styles.section}>
                <SectionHeader title="Nhà hàng gần bạn" targetMode="nearby" />

                {/* Hàng: Tabs phổ biến/đánh giá cao + nút Filter (góc phải) */}
                <div className={styles.tabsRow}>
                  <div className={styles.tabs}>
                    {FILTERS.map(({ key, label, Icon }) => (
                      <button
                        key={key}
                        type="button"
                        className={`${styles.tab} ${activeFilter === key ? styles.active : ""
                          }`}
                        onClick={() => setActiveFilter(key)}
                      >
                        <Icon /> {label}
                      </button>
                    ))}
                  </div>
                  <FilterDropdown />
                </div>

                <div className={styles.restaurantList}>
                  {/* Chỉ hiển thị 3 items */}
                  {renderRestaurantList(sortedNearbyRestaurants.slice(0, 3))}
                </div>
              </section>

              <hr className={styles.divider} />

              {/* Section 2: Top Rated */}
              <section className={styles.section}>
                <SectionHeader title="Top Đánh Giá Cao 🏆" targetMode="topRated" />
                <div className={styles.topRestaurantList}>
                  {/* Chỉ hiển thị 3 items */}
                  {topRestaurants.slice(0, 3).map((restaurant) => (
                    <TopRestaurantCard
                      key={restaurant.id}
                      restaurant={restaurant}
                      onSelect={handleRestaurantSelect}
                      isActive={selectedRestaurantId === restaurant.id}
                    />
                  ))}
                </div>
              </section>

              <hr className={styles.divider} />

              {/* Section 3: Tất cả */}
              <section className={styles.section}>
                <SectionHeader title="Tất cả nhà hàng" targetMode="all" />
                <div className={styles.restaurantList}>
                  {/* Chỉ hiển thị 3 items - dùng allRestaurants */}
                  {renderRestaurantList(allRestaurants.slice(0, 3))}
                </div>
              </section>
            </>
          )}

          {/* --- VIEW: CHI TIẾT NHÀ HÀNG GẦN BẠN --- */}
          {viewMode === 'nearby' && (
            <section className={styles.sectionFull}>
              <div className={styles.detailHeader}>
                <BackButton />
                <h2 className={styles.title}>Nhà hàng gần bạn</h2>
              </div>

              <p className={styles.subtitle}>
                {categories.length} loại hình ẩm thực · {restaurantsForNearby.length} điểm đến
              </p>

              {/* Hàng: Tabs phổ biến/đánh giá cao + nút Filter (góc phải) */}
              <div className={styles.tabsRow}>
                <div className={styles.tabs}>
                  {FILTERS.map(({ key, label, Icon }) => (
                    <button
                      key={key}
                      type="button"
                      className={`${styles.tab} ${activeFilter === key ? styles.active : ""
                        }`}
                      onClick={() => setActiveFilter(key)}
                    >
                      <Icon /> {label}
                    </button>
                  ))}
                </div>
                <FilterDropdown />
              </div>

              <div className={styles.restaurantList}>
                {/* Hiển thị Full list */}
                {renderRestaurantList(sortedNearbyRestaurants)}
              </div>
            </section>
          )}

          {/* --- VIEW: CHI TIẾT TOP RATED --- */}
          {viewMode === 'topRated' && (
            <section className={styles.sectionFull}>
              <div className={styles.detailHeader}>
                <BackButton />
                <h2 className={styles.title}>Top Đánh Giá Cao 🏆</h2>
              </div>
              <div className={styles.topRestaurantList}>
                {/* Hiển thị Full list */}
                {topRestaurants.map((restaurant) => (
                  <TopRestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    onSelect={handleRestaurantSelect}
                    isActive={selectedRestaurantId === restaurant.id}
                  />
                ))}
              </div>
            </section>
          )}

          {/* --- VIEW: CHI TIẾT TẤT CẢ --- */}
          {viewMode === 'all' && (
            <section className={styles.sectionFull}>
              <div className={styles.detailHeader}>
                <BackButton />
                <h2 className={styles.title}>Tất cả nhà hàng</h2>
              </div>
              <div className={styles.restaurantList}>
                {/* Hiển thị Full list - dùng allRestaurants (không bị ảnh hưởng bởi search) */}
                {renderRestaurantList(allRestaurants)}
              </div>
            </section>
          )}

        </aside>

        {/* Cột 2: Bản đồ */}
        <section className={styles.mapContainer}>
          <MapView
            key="main-map" // Key ổn định để tránh remount khi chuyển trang
            restaurants={mapRestaurants}
            selectedRestaurantId={selectedRestaurantId}
            onRestaurantSelect={handleRestaurantSelect}
            autoFitBounds={!!(searchParams.get('q') || searchParams.get('category'))} // Bật auto fit bounds khi có search
          />
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default DiscoverPage;