import React from 'react';
import styles from './TopRestaurantCard.module.css';
import { FaStar } from 'react-icons/fa';

const TopRestaurantCard = ({ restaurant }) => {
  return (
    <div className={styles.card}>
      <span className={styles.rank}>{restaurant.rank}</span>
      <img src={restaurant.image} alt={restaurant.name} className={styles.image} />
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
  );
};

export default TopRestaurantCard;