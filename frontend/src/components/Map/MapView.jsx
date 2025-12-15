import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
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

const foodIcon = L.icon({
  iconUrl:
    "https://cdn-icons-png.flaticon.com/512/1046/1046784.png", // fork & knife
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -28],
});

const drinkIcon = L.icon({
  iconUrl:
    "https://cdn-icons-png.flaticon.com/512/1046/1046786.png", // drink cup
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -28],
});

const getMarkerIcon = (restaurant) => {
  const rawCategory =
    restaurant.category ||
    (Array.isArray(restaurant.tags) ? restaurant.tags[0] : "") ||
    "";
  const category = rawCategory.toLowerCase();

  if (
    category.includes("cafe") ||
    category.includes("coffee") ||
    category.includes("drink") ||
    category.includes("dessert") ||
    category.includes("kem")
  ) {
    return drinkIcon;
  }

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

const MapView = ({
  restaurants = [],
  selectedRestaurantId,
  onRestaurantSelect = noop,
}) => {
  const [userPosition, setUserPosition] = useState(null);
  const mapRef = useRef(null);
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
    return (
      restaurantMarkers.find((item) => item.id === effectiveSelectedId) || null
    );
  }, [restaurantMarkers, effectiveSelectedId]);

  const handleDirectionsRequest = () => {
    if (!selectedRestaurant) return;
    const destination = `${selectedRestaurant.latitude},${selectedRestaurant.longitude}`;
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

    window.addEventListener("app:center-map-user", handleCenterOnUser);
    return () => window.removeEventListener("app:center-map-user", handleCenterOnUser);
  }, []);

  useEffect(() => {
    if (
      selectedRestaurant &&
      typeof selectedRestaurant.latitude === "number" &&
      typeof selectedRestaurant.longitude === "number" &&
      mapRef.current
    ) {
      mapRef.current.flyTo(
        [selectedRestaurant.latitude, selectedRestaurant.longitude],
        MARKER_ZOOM,
        { duration: 0.8 }
      );
    }
  }, [selectedRestaurant]);

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
        {restaurantMarkers.map((restaurant) => {
          const position = [restaurant.latitude, restaurant.longitude];
          return (
            <Marker
              key={restaurant.id}
              position={position}
              icon={getMarkerIcon(restaurant)}
              eventHandlers={{
                click: () => {
                  selectRestaurant(restaurant.id);
                  if (mapRef.current) {
                    mapRef.current.flyTo(position, MARKER_ZOOM, {
                      duration: 0.8,
                    });
                  }
                },
              }}
            >
            <Popup>{restaurant.name}</Popup>
          </Marker>
          );
        })}
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
