import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import styles from "./MapView.module.css";
import L from "leaflet";
import RestaurantDetailPopup from "./RestaurantDetailPopup";
import { useCollection } from "../../context/CollectionContext";

// Fix icon mặc định của leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const DEFAULT_CENTER = [16.0628, 108.215];
const MARKER_ZOOM = 17;
const FLY_TO_DURATION = 0.4; // Giảm từ 0.8s xuống 0.4s để mượt hơn
const MIN_ZOOM_TO_SHOW_MARKERS = 15; // Chỉ hiển thị markers khi zoom >= 13

// Helper function to parse coordinate
const parseCoordinate = (value) => {
  if (typeof value === "number") return value;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const fallbackRestaurants = [
  {
    id: "default-1",
    name: "Phở Bò 24",
    latitude: 16.06163,
    longitude: 108.20226,
    rating: 4.8,
    reviews: 120,
    category: "Món Việt",
    address: "123 Street, Thanh Khê, Đà Nẵng",
    status: "Mở đến 22:00",
    isOpen: true,
    description: "Quán phở truyền thống giữa lòng Đà Nẵng.",
    reviewsList: [],
  },
];

// Icon cho cafe/dessert/chè
const cafeIcon = L.icon({
  iconUrl:
    "https://cdn-icons-png.flaticon.com/512/7561/7561235.png", // cafe icon
  iconSize: [40, 40],
  iconAnchor: [15, 30],
  popupAnchor: [0, -28],
});

// Icon cho các quán ăn/restaurant (mặc định cho tất cả category khác)
const foodIcon = L.icon({
  iconUrl:
    "https://cdn-icons-png.flaticon.com/512/2702/2702446.png", // fork & knife icon
  iconSize: [40, 40],
  iconAnchor: [15, 30],
  popupAnchor: [0, -28],
});

const getMarkerIcon = (restaurant) => {
  // Ưu tiên kiểm tra mảng categories (many-to-many)
  let categories = [];

  if (restaurant.categories && Array.isArray(restaurant.categories) && restaurant.categories.length > 0) {
    // Nếu có mảng categories, lấy tên từ đó
    categories = restaurant.categories.map(cat =>
      typeof cat === 'string' ? cat : (cat.name || '')
    );
  } else if (restaurant.category) {
    // Fallback về category cũ (string)
    categories = [restaurant.category];
  } else if (Array.isArray(restaurant.tags) && restaurant.tags.length > 0) {
    // Fallback về tags
    categories = restaurant.tags;
  }

  // Danh sách các drink categories (dùng cafeIcon)
  const drinkCategories = [
    'coffee', 'cafe', 'bar', 'juice', 'dessert', 'chè', 'che',
    'ice cream', 'ice-cream'
  ];

  // Kiểm tra xem có category nào là drink không
  const categoryLower = categories.map(cat => (cat || '').toLowerCase().trim());

  const isDrinkCategory = categoryLower.some(cat => {
    // Check exact match
    if (drinkCategories.includes(cat)) {
      return true;
    }
    // Check partial match (bao gồm cả "Chè đậu", "Chè thái", "Coffee Shop", etc.)
    return drinkCategories.some(drinkCat => 
      cat.includes(drinkCat) || drinkCat.includes(cat)
  );
  });

  // Drink categories (Coffee, Bar, Juice, Dessert, Chè, Ice Cream) dùng cafeIcon
  if (isDrinkCategory) {
    return cafeIcon;
  }

  // Tất cả category khác (Food: Restaurant, Fast Food, BBQ, Seafood, Vietnamese, etc.) dùng foodIcon
  return foodIcon;
};

const MapInstanceRegistrar = ({ onReady }) => {
  const map = useMap();

  useEffect(() => {
    if (map && onReady) {
      onReady(map);
    }
  }, [map, onReady]);

  return null;
};

// Component để đóng popup khi click vào map
const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      // Chỉ đóng popup nếu click vào map, không phải vào marker
      // e.originalEvent.target sẽ là map tile nếu click vào map
      if (onMapClick) {
        onMapClick(e);
      }
    },
  });
  return null;
};

// Component để lắng nghe zoom level
const ZoomListener = ({ onZoomChange }) => {
  const map = useMap();
  
  useEffect(() => {
    const handleZoomEnd = () => {
      const currentZoom = map.getZoom();
      if (onZoomChange) {
        onZoomChange(currentZoom);
      }
    };
    
    // Lắng nghe sự kiện zoom
    map.on('zoomend', handleZoomEnd);
    // Gọi ngay lần đầu để lấy zoom level hiện tại
    handleZoomEnd();
    
    return () => {
      map.off('zoomend', handleZoomEnd);
    };
  }, [map, onZoomChange]);
  
  return null;
};

const noop = () => { };

// Component để control popup của marker
const MarkerWithPopupControl = ({ restaurant, onSelect, mapRef, markerRefs }) => {
  const markerRef = useRef(null);
  const lat = parseCoordinate(restaurant.latitude);
  const lng = parseCoordinate(restaurant.longitude);

  // Lưu marker ref vào markerRefs object
  useEffect(() => {
    if (markerRef.current) {
      markerRefs.current[restaurant.id] = markerRef.current;
    }
    return () => {
      delete markerRefs.current[restaurant.id];
    };
  }, [restaurant.id, markerRefs]);

  if (lat === null || lng === null) {
    return null;
  }

  const position = [lat, lng];

  return (
    <Marker
      ref={markerRef}
      position={position}
      icon={getMarkerIcon(restaurant)}
      eventHandlers={{
        click: () => {
          // Select restaurant ngay lập tức để popup detail hiện ngay
          onSelect(restaurant.id);
          // Zoom sẽ được xử lý trong useEffect để tránh duplicate
        },
      }}
    >
      {/* Tooltip hiển thị khi hover vào marker */}
      <Tooltip
        permanent={false}
        direction="top"
        offset={[0, -35]}
        opacity={0.9}
        className="restaurant-tooltip"
      >
        {restaurant.name}
      </Tooltip>
      {/* Popup hiển thị khi click vào marker */}
      <Popup>{restaurant.name}</Popup>
    </Marker>
  );
};

const MapView = ({
  restaurants = [],
  selectedRestaurantId,
  onRestaurantSelect = noop,
  autoFitBounds = false, // Bật auto fit bounds khi có search results
}) => {
  const [userPosition, setUserPosition] = useState(null);
  const [currentZoom, setCurrentZoom] = useState(14); // Default zoom level
  const [fullRestaurantData, setFullRestaurantData] = useState(null); // Lưu full data từ detail API
  const mapRef = useRef(null);
  const markerRefs = useRef({}); // Store refs for all markers
  const { recentSearches } = useCollection(); // Lấy danh sách tìm kiếm gần đây
  
  const handleMapReady = useCallback((mapInstance) => {
    mapRef.current = mapInstance;
    
    // Restore map position từ sessionStorage nếu có (khi quay lại trang)
    try {
      const savedCenter = sessionStorage.getItem('mapCenter');
      const savedZoom = sessionStorage.getItem('mapZoom');
      if (savedCenter && savedZoom) {
        const [lat, lng] = JSON.parse(savedCenter);
        const zoom = parseFloat(savedZoom);
        mapInstance.setView([lat, lng], zoom, {
          animate: false // Không animate khi restore
        });
        // Cập nhật currentZoom state
        setCurrentZoom(zoom);
      } else {
        // Nếu không có saved zoom, lấy zoom hiện tại
        setCurrentZoom(mapInstance.getZoom());
      }
    } catch (error) {
      console.warn('Không thể restore map position:', error);
      setCurrentZoom(mapInstance.getZoom());
    }
    
    // Lưu vị trí map vào sessionStorage khi user di chuyển
    mapInstance.on('moveend', () => {
      const center = mapInstance.getCenter();
      const zoom = mapInstance.getZoom();
      try {
        sessionStorage.setItem('mapCenter', JSON.stringify([center.lat, center.lng]));
        sessionStorage.setItem('mapZoom', zoom.toString());
      } catch (error) {
        console.warn('Không thể lưu map position:', error);
      }
    });
  }, []);
  
  const [fallbackSelectedId, setFallbackSelectedId] = useState(null);

  const isControlled = typeof selectedRestaurantId !== "undefined";

  const effectiveSelectedId = isControlled
    ? selectedRestaurantId
    : fallbackSelectedId;

  const selectRestaurant = useCallback(
    (id) => {
      if (isControlled) {
        onRestaurantSelect(id);
      } else {
        setFallbackSelectedId(id);
      }
    },
    [isControlled, onRestaurantSelect]
  );

  const restaurantMarkers = useMemo(
    () => (restaurants.length ? restaurants : fallbackRestaurants),
    [restaurants]
  );

  // Tạo Set các ID của restaurants tìm kiếm gần đây
  const recentSearchIds = useMemo(() => {
    return new Set(recentSearches.map(search => String(search.id)));
  }, [recentSearches]);

  // Filter markers dựa trên zoom level - chỉ hiển thị khi zoom đủ lớn
  // Nhưng luôn hiển thị restaurants tìm kiếm gần đây và restaurant đang được chọn
  const visibleMarkers = useMemo(() => {
    if (currentZoom >= MIN_ZOOM_TO_SHOW_MARKERS) {
      return restaurantMarkers;
    }
    
    // Nếu zoom quá nhỏ, chỉ hiển thị:
    // 1. Restaurant đang được chọn (nếu có)
    // 2. Restaurants tìm kiếm gần đây
    const markersToShow = restaurantMarkers.filter((r) => {
      const restaurantId = String(r.id);
      // Luôn hiển thị nếu là restaurant đang được chọn
      if (effectiveSelectedId && (String(effectiveSelectedId) === restaurantId || r.id === effectiveSelectedId)) {
        return true;
      }
      // Luôn hiển thị nếu là restaurant tìm kiếm gần đây
      if (recentSearchIds.has(restaurantId)) {
        return true;
      }
      return false;
    });
    
    return markersToShow;
  }, [restaurantMarkers, currentZoom, effectiveSelectedId, recentSearchIds]);

  // Fetch full restaurant detail từ API khi selected
  useEffect(() => {
    if (!effectiveSelectedId) {
      setFullRestaurantData(null);
      return;
    }

    const fetchFullRestaurantDetail = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
        const res = await fetch(`${API_BASE_URL}/restaurants/${effectiveSelectedId}`);
        if (!res.ok) {
          console.error('Không thể lấy thông tin nhà hàng');
          setFullRestaurantData(null);
          return;
        }

        const json = await res.json();
        if (json.success && json.data) {
          setFullRestaurantData(json.data);
        } else {
          setFullRestaurantData(null);
        }
      } catch (err) {
        console.error('Error fetching restaurant detail:', err);
        setFullRestaurantData(null);
      }
    };

    fetchFullRestaurantDetail();
  }, [effectiveSelectedId]);

  const selectedRestaurant = useMemo(() => {
    if (!effectiveSelectedId) return null;
    
    // Ưu tiên dùng fullRestaurantData nếu có (từ detail API)
    if (fullRestaurantData) {
      return fullRestaurantData;
    }
    
    // Fallback về restaurantMarkers nếu chưa fetch được detail
    return (
      restaurantMarkers.find(
        (item) => String(item.id) === String(effectiveSelectedId) || item.id === effectiveSelectedId
      ) || null
    );
  }, [restaurantMarkers, effectiveSelectedId, fullRestaurantData]);

  const handleDirectionsRequest = () => {
    if (!selectedRestaurant) return;
    const lat = parseCoordinate(selectedRestaurant.latitude);
    const lng = parseCoordinate(selectedRestaurant.longitude);
    if (lat === null || lng === null) return;

    const destination = `${lat},${lng}`;
    const origin = userPosition ? `${userPosition[0]},${userPosition[1]}` : "My+Location";
    const directionsUrl = `https://www.google.com/maps/dir/${encodeURIComponent(origin)}/${destination}`;
    window.open(directionsUrl, "_blank");
  };

  // Handler để đóng popup khi click vào map
  const handleMapClick = useCallback(() => {
    if (effectiveSelectedId) {
      selectRestaurant(null);
      setScrollToReview(false);
    }
  }, [effectiveSelectedId, selectRestaurant]);

  // Lấy vị trí hiện tại của user (chỉ lưu, không tự động zoom)
  // Chỉ zoom khi user click button "Vị trí của tôi"
  useEffect(() => {
    if (!navigator.geolocation) {
      setUserPosition([16.0628, 108.215]);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextPosition = [pos.coords.latitude, pos.coords.longitude];
        setUserPosition(nextPosition);
        // KHÔNG tự động zoom - chỉ lưu vị trí
        // Map sẽ giữ nguyên vị trí hiện tại
      },
      (err) => {
        console.log("Không lấy được vị trí, dùng vị trí mặc định:", err);
        const fallback = [16.0628, 108.215];
        setUserPosition(fallback);
        // KHÔNG tự động zoom
      }
    );
  }, []);

  useEffect(() => {
    const handleCenterOnUser = (event) => {
      const { latitude, longitude } = event.detail || {};
      if (typeof latitude !== "number" || typeof longitude !== "number") return;
      const nextPosition = [latitude, longitude];
      setUserPosition(nextPosition);
      // Chỉ zoom khi user click button "Vị trí của tôi"
      if (mapRef.current) {
        mapRef.current.flyTo(nextPosition, MARKER_ZOOM, {
          duration: FLY_TO_DURATION,
        });
      }
    };

    const handleCenterOnRestaurant = (event) => {
      const { latitude, longitude, restaurantId } = event.detail || {};
      if (typeof latitude !== "number" || typeof longitude !== "number") return;
      const position = [latitude, longitude];

      // Ping map to restaurant location
      if (mapRef.current) {
        mapRef.current.flyTo(position, MARKER_ZOOM, {
          duration: FLY_TO_DURATION,
        });
      }

      // If restaurantId is provided, select that restaurant
      if (restaurantId) {
        selectRestaurant(restaurantId);
      }
    };

    // Event để đóng popup (từ navbar dropdown hoặc click map)
    const handleClosePopup = () => {
      selectRestaurant(null);
      setScrollToReview(false);
    };

    window.addEventListener("app:center-map-user", handleCenterOnUser);
    window.addEventListener("app:center-map-restaurant", handleCenterOnRestaurant);
    window.addEventListener("app:close-restaurant-popup", handleClosePopup);
    return () => {
      window.removeEventListener("app:center-map-user", handleCenterOnUser);
      window.removeEventListener("app:center-map-restaurant", handleCenterOnRestaurant);
      window.removeEventListener("app:close-restaurant-popup", handleClosePopup);
    };
  }, [selectRestaurant]);

  // Auto fit bounds khi có search results (autoFitBounds = true)
  useEffect(() => {
    if (!autoFitBounds || !mapRef.current || restaurantMarkers.length === 0) {
      return;
    }

    // Tính toán bounds từ tất cả restaurants
    const validMarkers = restaurantMarkers.filter(r => {
      const lat = parseCoordinate(r.latitude);
      const lng = parseCoordinate(r.longitude);
      return lat !== null && lng !== null;
    });

    if (validMarkers.length === 0) {
      return;
    }

    // Nếu chỉ có 1 marker, zoom vào marker đó
    if (validMarkers.length === 1) {
      const lat = parseCoordinate(validMarkers[0].latitude);
      const lng = parseCoordinate(validMarkers[0].longitude);
      if (lat !== null && lng !== null) {
        mapRef.current.flyTo([lat, lng], MARKER_ZOOM, {
          duration: FLY_TO_DURATION,
        });
      }
      return;
    }

    // Nếu có nhiều markers, fit bounds
    const bounds = L.latLngBounds(
      validMarkers.map(r => [
        parseCoordinate(r.latitude),
        parseCoordinate(r.longitude)
      ])
    );

    // Fit bounds với padding để không sát mép
    mapRef.current.flyToBounds(bounds, {
      padding: [50, 50], // Padding 50px mỗi bên
      duration: FLY_TO_DURATION,
      maxZoom: 16 // Giới hạn zoom tối đa
    });
  }, [autoFitBounds, restaurantMarkers]);

  // Zoom to selected restaurant when selectedRestaurantId changes
  // Popup detail sẽ hiện ngay, không cần chờ animation
  useEffect(() => {
    if (!effectiveSelectedId || !selectedRestaurant || !mapRef.current) {
      return;
    }

    // Nếu đang auto fit bounds, không zoom vào selected restaurant
    if (autoFitBounds) {
      return;
    }

    const lat = parseCoordinate(selectedRestaurant.latitude);
    const lng = parseCoordinate(selectedRestaurant.longitude);

    if (lat !== null && lng !== null) {
      const position = [lat, lng];
      
      // FlyTo với duration ngắn hơn để mượt hơn
      mapRef.current.flyTo(position, MARKER_ZOOM, {
        duration: FLY_TO_DURATION,
      });

      // Popup detail đã được hiển thị ngay qua selectedRestaurant state
      // Không cần setTimeout vì popup detail là component riêng, không phải Leaflet popup
    }
  }, [effectiveSelectedId, selectedRestaurant, autoFitBounds]);

  return (
    <div className={styles.mapWrapper}>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={14}
        scrollWheelZoom={true}
        className={styles.map}
      >
        <MapInstanceRegistrar onReady={handleMapReady} />
        <MapClickHandler onMapClick={handleMapClick} />
        <ZoomListener onZoomChange={setCurrentZoom} />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* Marker vị trí người dùng */}
        {userPosition && (
          <Marker position={userPosition}>
            <Popup>Vị trí của bạn</Popup>
          </Marker>
        )}

        {/* Marker các quán ăn - chỉ hiển thị khi zoom đủ lớn */}
        {visibleMarkers.map((restaurant) => (
          <MarkerWithPopupControl
            key={restaurant.id}
            restaurant={restaurant}
            onSelect={selectRestaurant}
            mapRef={mapRef}
            markerRefs={markerRefs}
          />
        ))}
      </MapContainer>
      {selectedRestaurant && (
        <div 
          className={styles.detailPopupWrapper}
          onClick={(e) => {
            // Đóng popup khi click vào overlay (chỉ trên mobile)
            if (window.innerWidth <= 768 && e.target === e.currentTarget) {
              selectRestaurant(null);
            }
          }}
        >
          <RestaurantDetailPopup
            restaurant={selectedRestaurant}
            onRequestDirections={handleDirectionsRequest}
            onClose={() => {
              selectRestaurant(null);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default MapView;
