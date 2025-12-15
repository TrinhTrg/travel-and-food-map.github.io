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
            <span>{restaurant.status}</span>
            <div className={styles.tags}>
              {restaurant.tags.map((tag) => (
                <span key={tag} className={styles.tag}>
                  {tag}
                </span>
              ))}
              <span className={styles.price}>{restaurant.price}</span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};

export default RestaurantCard;