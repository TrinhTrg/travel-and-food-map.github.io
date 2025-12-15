import React, { useEffect } from 'react';
import styles from './TopRestaurantCard.module.css';
import { FaStar } from 'react-icons/fa';

const TopRestaurantCard = ({ restaurant, onSelect, isActive = false }) => {
  const handleClick = () => {
    if (onSelect) {
      onSelect(restaurant);
    }
  };

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
      className={`${styles.cardButton} ${isActive ? styles.cardButtonActive : ''}`}
      onClick={handleClick}
    >
      <div className={styles.card}>
        <span className={styles.rank}>{restaurant.rank}</span>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={restaurant.name}
            className={styles.image}
          />
        ) : (
          <div className={styles.imagePlaceholder}></div>
        )}
        <div className={styles.content}>
          <h4 className={styles.name}>{restaurant.name}</h4>
          <div className={styles.info}>
            <span className={styles.category}>{restaurant.category}</span>
            <span className={styles.price}>{restaurant.price}</span>
          </div>
          <div className={styles.rating}>
            <FaStar />
            <span>{restaurant.rating}</span>
          </div>
        </div>
      </div>
    </button>
  );
};

export default TopRestaurantCard;