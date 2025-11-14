import React from 'react';
import styles from './RestaurantCard.module.css';
import { FaStar, FaMapMarkerAlt } from 'react-icons/fa';
import { FiHeart } from 'react-icons/fi'; 

const RestaurantCard = ({ restaurant }) => {
  return (
    <div className={styles.card}>
      <img 
        src={restaurant.image} 
        alt={restaurant.name} 
        className={styles.cardImage} 
      />
      <div className={styles.cardContent}>
        <div className={styles.header}>
          <h3 className={styles.name}>{restaurant.name}</h3>
          <FiHeart className={styles.heartIcon} />
        </div>
        
        <div className={styles.rating}>
          <FaStar className={styles.starIcon} />
          <span className={styles.score}>{restaurant.rating}</span>
          <span className={styles.reviews}>({restaurant.reviews} đánh giá)</span>
        </div>

        <div className={styles.address}>
          <FaMapMarkerAlt />
          <span>{restaurant.address}</span>
        </div>

        <div className={styles.info}>
          <span>{restaurant.status}</span>
          <div className={styles.tags}>
            {restaurant.tags.map((tag) => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
            <span className={styles.price}>{restaurant.price}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantCard;