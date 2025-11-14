import React from 'react';
// Import thư viện css module 
import styles from './Navbar.module.css';
import { NavLink } from "react-router-dom";

// 1. TÁCH IMPORT ICON: Thêm import cho FiSearch
import { FaMapMarkerAlt, FaPlus, FaUser } from 'react-icons/fa'; // Icon từ Font Awesome
import { FiSearch } from 'react-icons/fi'; // Icon từ Feather Icons

import imglogo from '../../assets/logo.png'; // Import logo

const Navbar = () => {
  return (
    <nav className={styles.navbar}>

      {/* 2. BỌC LOGO VÀ SEARCH BAR VÀO .navLeft */}
      <div className={styles.navLeft}>
        
        {/* Logo của bạn */}
        <div className={styles.logo}>
          <NavLink to="/">
            <img src={imglogo} alt="FoodGo Logo" />
          </NavLink>
        </div>

        {/* Thanh tìm kiếm */}
        <div className={styles.searchBar}>
          <FiSearch />
          <input type="text" placeholder="Tìm kiếm địa điểm, món ăn..." />
        </div>
      </div>
      
      {/* 2: Các link điều hướng (Giữ nguyên code NavLink của bạn) */}
      <ul className={styles.navLinks}>
        <li>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? styles.active : undefined
            }
          >
            Home
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/kham-pha"
            className={({ isActive }) =>
              isActive ? styles.active : undefined
            }
          >
            Khám Phá
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/how-it-works"
            className={({ isActive }) =>
              isActive ? styles.active : undefined
            }
          >
            How It Works
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/contact"
            className={({ isActive }) =>
              isActive ? styles.active : undefined
            }
          >
            Contact
          </NavLink>
        </li>
      </ul>

      {/* 3: Các nút hành động (Giữ nguyên) */}
      <div className={styles.actions}>
        <button className={styles.iconButton}>
          <FaMapMarkerAlt /> Vị trí hiện tại
        </button>
        <button className={styles.iconButtonOrange}>
          <FaPlus />
        </button>
        <button className={styles.iconButton}>
          <FaUser /> Đăng nhập
        </button>
      </div>
    </nav>
  );
};

export default Navbar;