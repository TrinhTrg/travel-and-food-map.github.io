import React, { useEffect } from "react";
import styles from "./RestaurantCard.module.css";
import { FaStar, FaMapMarkerAlt } from "react-icons/fa";
import { FiHeart } from "react-icons/fi";

const RestaurantCard = ({ restaurant, onSelect, isActive = false }) => {
  const handleClick = () => {
    if (onSelect) {
      onSelect(restaurant);
    }
  };

  const distanceLabel =
    typeof restaurant.distanceKm === "number"
      ? `${restaurant.distanceKm.toFixed(1)} km`
      : null;

  // Kiểm tra ảnh từ các field có thể có
  const imageUrl = restaurant.image || restaurant.image_url || restaurant.bannerImage;

  // Log khi không có ảnh
  useEffect(() => {
    if (!imageUrl) {
      console.log("không có ảnh", restaurant.name || restaurant.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Xác định màu status: xanh cho "Đang mở cửa", đỏ cho "Đã đóng cửa"
  // Ưu tiên sử dụng openStatus từ API, nếu không có thì tính từ isOpen
  const statusLabel = restaurant.openStatus || 
    (restaurant.isOpen !== undefined 
      ? (restaurant.isOpen ? "Đang mở cửa" : "Đã đóng cửa")
      : "Đang cập nhật");
  
  const isOpen = restaurant.isOpen !== undefined 
    ? restaurant.isOpen 
    : (statusLabel.toLowerCase().includes("mở") && !statusLabel.toLowerCase().includes("đóng"));
  const statusClass = isOpen ? styles.statusOpen : styles.statusClosed;

  // Lọc tags để loại bỏ những tag chứa "$$"
  const filteredTags = restaurant.tags 
    ? restaurant.tags.filter(tag => !tag.includes("$$"))
    : [];

  return (
    <button
      type="button"
      className={`${styles.cardButton} ${isActive ? styles.cardActive : ""}`}
      onClick={handleClick}
    >
      <div className={styles.card}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={restaurant.name}
            className={styles.cardImage}
          />
        ) : (
          <div className={styles.cardImagePlaceholder}></div>
        )}
        <div className={styles.cardContent}>
          <div className={styles.header}>
            <h3 className={styles.name}>{restaurant.name}</h3>
            <FiHeart className={styles.heartIcon} />
          </div>

          <div className={styles.rating}>
            <FaStar className={styles.starIcon} />
            <span className={styles.score}>{restaurant.rating}</span>
            <span className={styles.reviews}>
              ({restaurant.reviews} đánh giá)
            </span>
          </div>

          <div className={styles.addressRow}>
            <div className={styles.address}>
              <FaMapMarkerAlt />
              <span>{restaurant.address}</span>
            </div>
            {distanceLabel && (
              <span className={styles.distance}>{distanceLabel}</span>
            )}
          </div>

          <div className={styles.info}>
            <span className={statusClass}>{statusLabel}</span>
            <div className={styles.tags}>
              {filteredTags.map((tag) => (
                <span key={tag} className={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};

export default RestaurantCard;