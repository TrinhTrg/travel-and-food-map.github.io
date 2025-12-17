import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import styles from "./MapView.module.css";
import L from "leaflet";
import RestaurantDetailPopup from "./RestaurantDetailPopup";

// Fix icon mặc định của leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const DEFAULT_CENTER = [16.0628, 108.215];
const MARKER_ZOOM = 17;

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
  const rawCategory =
    restaurant.category ||
    (Array.isArray(restaurant.tags) ? restaurant.tags[0] : "") ||
    "";
  const category = rawCategory.toLowerCase().trim();

  // Cafe, Dessert, Chè dùng cafeIcon
  if (
    category === "cafe" ||
    category === "dessert" ||
    category === "chè"
  ) {
    return cafeIcon;
  }

  // Tất cả category khác dùng foodIcon
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

const noop = () => {};

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
          onSelect(restaurant.id);
          // Zoom is handled by useEffect, but we can also do it here for immediate feedback
          if (mapRef.current) {
            mapRef.current.flyTo(position, MARKER_ZOOM, {
              duration: 0.8,
            });
          }
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
}) => {
  const [userPosition, setUserPosition] = useState(null);
  const mapRef = useRef(null);
  const markerRefs = useRef({}); // Store refs for all markers
  const handleMapReady = useCallback((mapInstance) => {
    mapRef.current = mapInstance;
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

  const selectedRestaurant = useMemo(() => {
    if (!effectiveSelectedId) return null;
    // So sánh ID cả string và number để đảm bảo tìm được
    return (
      restaurantMarkers.find(
        (item) => String(item.id) === String(effectiveSelectedId) || item.id === effectiveSelectedId
      ) || null
    );
  }, [restaurantMarkers, effectiveSelectedId]);

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

  // Lấy vị trí hiện tại của user và focus map vào vị trí đó
  useEffect(() => {
    if (!navigator.geolocation) {
      setUserPosition([16.0628, 108.215]);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextPosition = [pos.coords.latitude, pos.coords.longitude];
        setUserPosition(nextPosition);
        if (mapRef.current) {
          mapRef.current.setView(nextPosition, MARKER_ZOOM);
        }
      },
      (err) => {
        console.log("Không lấy được vị trí, dùng vị trí mặc định:", err);
        const fallback = [16.0628, 108.215];
        setUserPosition(fallback);
        if (mapRef.current) {
          mapRef.current.setView(fallback, 14);
        }
      }
    );
  }, []);

  useEffect(() => {
    const handleCenterOnUser = (event) => {
      const { latitude, longitude } = event.detail || {};
      if (typeof latitude !== "number" || typeof longitude !== "number") return;
      const nextPosition = [latitude, longitude];
      setUserPosition(nextPosition);
      if (mapRef.current) {
        mapRef.current.flyTo(nextPosition, MARKER_ZOOM, {
          duration: 0.8,
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
          duration: 0.8,
        });
      }
      
      // If restaurantId is provided, select that restaurant
      if (restaurantId) {
        selectRestaurant(restaurantId);
      }
    };

    window.addEventListener("app:center-map-user", handleCenterOnUser);
    window.addEventListener("app:center-map-restaurant", handleCenterOnRestaurant);
    return () => {
      window.removeEventListener("app:center-map-user", handleCenterOnUser);
      window.removeEventListener("app:center-map-restaurant", handleCenterOnRestaurant);
    };
  }, [selectRestaurant]);

  // Zoom to selected restaurant when selectedRestaurantId changes and open popup
  useEffect(() => {
    if (!effectiveSelectedId || !selectedRestaurant || !mapRef.current) {
      return;
    }

    const lat = parseCoordinate(selectedRestaurant.latitude);
    const lng = parseCoordinate(selectedRestaurant.longitude);

    if (lat !== null && lng !== null) {
      const position = [lat, lng];
      mapRef.current.flyTo(position, MARKER_ZOOM, {
        duration: 0.8,
      });

      // Mở popup sau khi map đã flyTo xong
      setTimeout(() => {
        const markerRef = markerRefs.current[effectiveSelectedId];
        if (markerRef) {
          const leafletMarker = markerRef?.leafletElement || markerRef;
          if (leafletMarker && typeof leafletMarker.openPopup === 'function') {
            leafletMarker.openPopup();
          }
        }
      }, 900); // Sau khi flyTo hoàn thành (duration 0.8s + buffer 0.1s)
    }
  }, [effectiveSelectedId, selectedRestaurant]);

  return (
    <div className={styles.mapWrapper}>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={14}
        scrollWheelZoom={true}
        className={styles.map}
      >
        <MapInstanceRegistrar onReady={handleMapReady} />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* Marker vị trí người dùng */}
        {userPosition && (
          <Marker position={userPosition}>
            <Popup>Vị trí của bạn</Popup>
          </Marker>
        )}

        {/* Marker các quán ăn */}
        {restaurantMarkers.map((restaurant) => (
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
        <div className={styles.detailPopupWrapper}>
          <RestaurantDetailPopup
            restaurant={selectedRestaurant}
            onRequestDirections={handleDirectionsRequest}
            onClose={() => selectRestaurant(null)}
          />
        </div>
      )}
    </div>
  );
};

export default MapView;
