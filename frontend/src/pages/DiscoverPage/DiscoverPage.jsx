import React from 'react';
import styles from './DiscoverPage.module.css';
import Navbar from '../../components/Navbar/Navbar'; // Dùng lại Navbar
import Footer from '../../components/Footer/Footer'; // Dùng lại Footer
import RestaurantCard from '../../components/RestaurantCard/RestaurantCard';
import TopRestaurantCard from '../../components/TopRestaurantCard/TopRestaurantCard';
import { FaFire, FaStar } from 'react-icons/fa';

import imgPhoBo from '../../assets/phobo.png';
import imgSushi from '../../assets/sushi.png';
// --- Dữ liệu giả (dummy data) để hiển thị UI ---
const nearbyRestaurants = [
  {
    id: 1,
    name: "Phở Bò 24",
    image: imgPhoBo,
    rating: 4.8,
    reviews: 1234,
    address: "123 Street, Thanh Khê, Đà Nẵng",
    status: "Đang mở cửa",
    tags: ["Phở", "Món Việt"],
    price: "$$"
  },
  {
    id: 2,
    name: "Sushi Tokyo Bay",
    image: imgSushi,
    rating: 4.9,
    reviews: 897,
    address: "ABC Street, Sơn Trà, Đà Nẵng",
    status: "Đang mở cửa",
    tags: ["Sushi", "Nhật Bản"],
    price: "$$$"
  },
];

const topRestaurants = [
  { id: 1, rank: 1, name: "La Maison Fine Dining", category: "Pháp", price: "$$$", rating: 4.9, image: "" },
  { id: 2, rank: 2, name: "Thai Orchid Garden", category: "Thái", price: "$$", rating: 4.8, image: "" },
];
// --- Hết dữ liệu giả ---


const DiscoverPage = () => {
  return (
    <div className={styles.pageContainer}>
      <Navbar /> 

      <main className={styles.mainContent}>
        {/* Cột 1: Sidebar danh sách */}
        <aside className={styles.sidebar}>
          <h2 className={styles.title}>Nhà hàng gần bạn</h2>
          
          {/* Tabs */}
          <div className={styles.tabs}>
            <button className={`${styles.tab} ${styles.active}`}>
              <FaFire /> Phổ biến
            </button>
            <button className={styles.tab}>
              <FaStar /> Đánh giá cao
            </button>
          </div>

          {/* Danh sách nhà hàng */}
          <div className={styles.restaurantList}>
            {nearbyRestaurants.map(restaurant => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>

          <hr className={styles.divider} />

          {/* Top nhà hàng */}
          <h2 className={styles.title}>Top Nhà Hàng Được Đánh Giá Cao 🏆</h2>
          <div className={styles.topRestaurantList}>
            {topRestaurants.map(restaurant => (
              <TopRestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        </aside>

        {/* Cột 2: Bản đồ */}
        <section className={styles.mapContainer}>
          <div className={styles.mapPlaceholder}>
            Bản đồ sẽ hiển thị ở đây
          </div>
        </section>
      </main>
    <Footer /> 
    </div>
  );
};

export default DiscoverPage;