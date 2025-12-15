import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import styles from './AdminDashboard.module.css';
import {
  FaStore,
  FaCheckCircle,
  FaClock,
  FaUsers,
  FaUserTie,
  FaUserShield,
  FaCheck,
  FaTimes,
  FaEdit
} from 'react-icons/fa';

const AdminDashboard = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [pendingRestaurants, setPendingRestaurants] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('stats'); // 'stats', 'pending', 'users'
  const [editingUser, setEditingUser] = useState(null);
  const [newRole, setNewRole] = useState('');

  // Redirect nếu không phải admin
  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate('/');
    }
  }, [isAuthenticated, isAdmin, navigate]);

  // Fetch data
  useEffect(() => {
    if (!isAdmin) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, pendingRes, usersRes] = await Promise.all([
          adminAPI.getStats(),
          adminAPI.getPendingRestaurants(),
          adminAPI.getUsers()
        ]);

        if (statsRes.success) setStats(statsRes.data);
        if (pendingRes.success) setPendingRestaurants(pendingRes.data);
        if (usersRes.success) setUsers(usersRes.data);
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin]);

  const handleApproveRestaurant = async (id) => {
    try {
      const response = await adminAPI.approveRestaurant(id);
      if (response.success) {
        setPendingRestaurants(pendingRestaurants.filter(r => r.id !== id));
        // Update stats
        if (stats) {
          setStats({
            ...stats,
            restaurants: {
              ...stats.restaurants,
              approved: stats.restaurants.approved + 1,
              pending: stats.restaurants.pending - 1
            }
          });
        }
      }
    } catch (error) {
      alert('Lỗi khi duyệt nhà hàng: ' + error.message);
    }
  };

  const handleRejectRestaurant = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn từ chối nhà hàng này?')) return;

    try {
      const response = await adminAPI.rejectRestaurant(id);
      if (response.success) {
        setPendingRestaurants(pendingRestaurants.filter(r => r.id !== id));
        // Update stats
        if (stats) {
          setStats({
            ...stats,
            restaurants: {
              ...stats.restaurants,
              pending: stats.restaurants.pending - 1
            }
          });
        }
      }
    } catch (error) {
      alert('Lỗi khi từ chối nhà hàng: ' + error.message);
    }
  };

  const handleUpdateUserRole = async (userId) => {
    if (!newRole) return;

    try {
      const response = await adminAPI.updateUserRole(userId, newRole);
      if (response.success) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        setEditingUser(null);
        setNewRole('');
      }
    } catch (error) {
      alert('Lỗi khi cập nhật role: ' + error.message);
    }
  };

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <Navbar />
        <main className={styles.mainContent}>
          <div className={styles.loading}>Đang tải...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <Navbar />
      <main className={styles.mainContent}>
        <div className={styles.dashboard}>
          <h1 className={styles.title}>Admin Dashboard</h1>

          {/* Tabs */}
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'stats' ? styles.active : ''}`}
              onClick={() => setActiveTab('stats')}
            >
              Thống kê
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'pending' ? styles.active : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              Nhà hàng chờ duyệt ({pendingRestaurants.length})
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'users' ? styles.active : ''}`}
              onClick={() => setActiveTab('users')}
            >
              Quản lý người dùng
            </button>
          </div>

          {/* Stats Tab */}
          {activeTab === 'stats' && stats && (
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <FaStore />
                </div>
                <div className={styles.statContent}>
                  <h3>Tổng nhà hàng</h3>
                  <p className={styles.statValue}>{stats.restaurants.total}</p>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={`${styles.statIcon} ${styles.statIconSuccess}`}>
                  <FaCheckCircle />
                </div>
                <div className={styles.statContent}>
                  <h3>Đã duyệt</h3>
                  <p className={styles.statValue}>{stats.restaurants.approved}</p>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={`${styles.statIcon} ${styles.statIconWarning}`}>
                  <FaClock />
                </div>
                <div className={styles.statContent}>
                  <h3>Chờ duyệt</h3>
                  <p className={styles.statValue}>{stats.restaurants.pending}</p>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={`${styles.statIcon} ${styles.statIconInfo}`}>
                  <FaUsers />
                </div>
                <div className={styles.statContent}>
                  <h3>Tổng người dùng</h3>
                  <p className={styles.statValue}>{stats.users.total}</p>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={`${styles.statIcon} ${styles.statIconPrimary}`}>
                  <FaUserTie />
                </div>
                <div className={styles.statContent}>
                  <h3>Owners</h3>
                  <p className={styles.statValue}>{stats.users.owners}</p>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={`${styles.statIcon} ${styles.statIconDanger}`}>
                  <FaUserShield />
                </div>
                <div className={styles.statContent}>
                  <h3>Admins</h3>
                  <p className={styles.statValue}>{stats.users.admins}</p>
                </div>
              </div>
            </div>
          )}

          {/* Pending Restaurants Tab */}
          {activeTab === 'pending' && (
            <div className={styles.pendingList}>
              {pendingRestaurants.length === 0 ? (
                <div className={styles.emptyState}>Không có nhà hàng nào chờ duyệt</div>
              ) : (
                pendingRestaurants.map((restaurant) => (
                  <div key={restaurant.id} className={styles.pendingCard}>
                    <div className={styles.pendingInfo}>
                      <h3>{restaurant.name}</h3>
                      <p className={styles.pendingAddress}>{restaurant.address}</p>
                      <p className={styles.pendingCategory}>
                        Danh mục: {restaurant.category?.name || 'N/A'}
                      </p>
                      {restaurant.owner && (
                        <p className={styles.pendingOwner}>
                          Người đăng: {restaurant.owner.name} ({restaurant.owner.email})
                        </p>
                      )}
                      <p className={styles.pendingDate}>
                        Ngày đăng: {new Date(restaurant.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <div className={styles.pendingActions}>
                      <button
                        className={styles.approveButton}
                        onClick={() => handleApproveRestaurant(restaurant.id)}
                      >
                        <FaCheck /> Duyệt
                      </button>
                      <button
                        className={styles.rejectButton}
                        onClick={() => handleRejectRestaurant(restaurant.id)}
                      >
                        <FaTimes /> Từ chối
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className={styles.usersTable}>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Số nhà hàng</th>
                    <th>Ngày tạo</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        {editingUser === user.id ? (
                          <select
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                            className={styles.roleSelect}
                          >
                            <option value="user">User</option>
                            <option value="owner">Owner</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span className={`${styles.roleBadge} ${styles[`role${user.role}`]}`}>
                            {user.role}
                          </span>
                        )}
                      </td>
                      <td>{user.restaurantCount || 0}</td>
                      <td>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
                      <td>
                        {editingUser === user.id ? (
                          <div className={styles.editActions}>
                            <button
                              className={styles.saveButton}
                              onClick={() => handleUpdateUserRole(user.id)}
                            >
                              <FaCheck />
                            </button>
                            <button
                              className={styles.cancelButton}
                              onClick={() => {
                                setEditingUser(null);
                                setNewRole('');
                              }}
                            >
                              <FaTimes />
                            </button>
                          </div>
                        ) : (
                          <button
                            className={styles.editButton}
                            onClick={() => {
                              setEditingUser(user.id);
                              setNewRole(user.role);
                            }}
                          >
                            <FaEdit /> Sửa
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;

