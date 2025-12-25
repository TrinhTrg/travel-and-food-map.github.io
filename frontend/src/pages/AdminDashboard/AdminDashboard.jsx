import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { adminAPI, menuItemAPI } from '../../services/api';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
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
  FaEdit,
  FaUtensils,
  FaArrowLeft
} from 'react-icons/fa';

const AdminDashboard = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [pendingRestaurants, setPendingRestaurants] = useState([]);
  const [pendingMenuItems, setPendingMenuItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('stats'); // 'stats', 'pending', 'pendingMenu', 'users'
  const [editingUser, setEditingUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingItemId, setRejectingItemId] = useState(null);
  
  // Confirm modal states
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    confirmText: 'OK',
    cancelText: 'Hủy',
    confirmButtonStyle: 'primary',
    onConfirm: null,
  });
  
  // Prevent double-click on action buttons
  const [processingAction, setProcessingAction] = useState(null);

  const BACKEND_URL = 'http://localhost:3000';

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
        const [statsRes, pendingRes, usersRes, pendingMenuRes] = await Promise.all([
          adminAPI.getStats(),
          adminAPI.getPendingRestaurants(),
          adminAPI.getUsers(),
          menuItemAPI.getPendingMenuItems()
        ]);

        if (statsRes.success) setStats(statsRes.data);
        if (pendingRes.success) setPendingRestaurants(pendingRes.data);
        if (usersRes.success) setUsers(usersRes.data);
        if (pendingMenuRes.success) setPendingMenuItems(pendingMenuRes.data);
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin]);

  // Helper để lấy full URL cho ảnh
  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('blob:')) return url;
    return `${BACKEND_URL}${url}`;
  };

  const handleApproveRestaurant = async (id) => {
    if (processingAction === `approve-restaurant-${id}`) return;
    setProcessingAction(`approve-restaurant-${id}`);
    
    setConfirmModal({
      isOpen: true,
      title: 'Xác nhận duyệt',
      message: 'Bạn có chắc chắn muốn duyệt nhà hàng này?',
      type: 'info',
      confirmText: 'Xác nhận',
      cancelText: 'Hủy',
      confirmButtonStyle: 'primary',
      onConfirm: async () => {
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
            showSuccess('Thành công', 'Đã duyệt nhà hàng thành công');
          }
        } catch (error) {
          showError('Lỗi', 'Lỗi khi duyệt nhà hàng: ' + error.message);
        } finally {
          setProcessingAction(null);
        }
      },
    });
  };

  const handleRejectRestaurant = async (id) => {
    if (processingAction === `reject-restaurant-${id}`) return; // Prevent double-click
    setProcessingAction(`reject-restaurant-${id}`);
    
    setConfirmModal({
      isOpen: true,
      title: 'Xác nhận từ chối',
      message: 'Bạn có chắc chắn muốn từ chối nhà hàng này?',
      type: 'warning',
      confirmText: 'Xác nhận',
      cancelText: 'Hủy',
      confirmButtonStyle: 'danger',
      onConfirm: async () => {
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
            showSuccess('Thành công', 'Đã từ chối nhà hàng thành công');
          }
        } catch (error) {
          showError('Lỗi', 'Lỗi khi từ chối nhà hàng: ' + error.message);
        } finally {
          setProcessingAction(null);
        }
      },
    });
  };

  const handleUpdateUserRole = async (userId) => {
    if (!newRole) return;
    if (processingAction === `update-role-${userId}`) return;
    setProcessingAction(`update-role-${userId}`);

    const user = users.find(u => u.id === userId);
    const oldRole = user?.role;

    // Confirmation dialog chi tiết
    let confirmTitle = 'Xác nhận thay đổi role';
    let confirmMessage = '';
    let confirmType = 'warning';
    let confirmButtonStyle = 'primary';

    if (newRole === 'owner' && oldRole !== 'owner') {
      confirmTitle = 'Phong làm Owner';
      confirmMessage = `Bạn có chắc muốn phong "${user?.name}" (${user?.email}) làm Owner?\n\nSau khi xác nhận:\n• User sẽ có quyền tạo và quản lý nhà hàng\n• User sẽ có quyền thêm/sửa/xóa menu\n• Email thông báo sẽ được gửi đến ${user?.email}`;
      confirmType = 'info';
    } else if (oldRole === 'owner' && newRole !== 'owner') {
      confirmTitle = 'Hạ cấp từ Owner';
      confirmMessage = `Bạn có chắc muốn hạ cấp "${user?.name}" từ Owner xuống ${newRole}?\n\nSau khi xác nhận:\n• User sẽ mất quyền quản lý nhà hàng\n• Các nhà hàng hiện tại vẫn được giữ\n• Email thông báo sẽ được gửi`;
      confirmType = 'warning';
    } else if (newRole === 'admin') {
      confirmTitle = 'Phong làm Admin';
      confirmMessage = `Bạn có chắc muốn phong "${user?.name}" làm Admin?\n\n⚠️ Admin có toàn quyền trên hệ thống!`;
      confirmType = 'danger';
      confirmButtonStyle = 'danger';
    } else {
      confirmMessage = `Bạn có chắc muốn đổi role của "${user?.name}" thành ${newRole}?`;
    }

    setConfirmModal({
      isOpen: true,
      title: confirmTitle,
      message: confirmMessage,
      type: confirmType,
      confirmText: 'Xác nhận',
      cancelText: 'Hủy',
      confirmButtonStyle: confirmButtonStyle,
      onConfirm: async () => {
        try {
          const response = await adminAPI.updateUserRole(userId, newRole);
          if (response.success) {
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
            setEditingUser(null);
            setNewRole('');

            // Hiển thị thông báo chi tiết
            let successTitle = 'Thành công';
            let successMessage = `Đã cập nhật role thành ${newRole}`;
            if (response.emailSent) {
              successMessage += `. Email thông báo đã được gửi đến ${user?.email}`;
            }
            if (newRole === 'owner') {
              successMessage += '. User giờ đã có thể tạo và quản lý nhà hàng!';
            }
            showSuccess(successTitle, successMessage);
          }
        } catch (error) {
          showError('Lỗi', 'Lỗi khi cập nhật role: ' + error.message);
        }
      },
    });
  };

  // Menu Item handlers
  const handleApproveMenuItem = async (id) => {
    if (processingAction === `approve-menu-${id}`) return;
    setProcessingAction(`approve-menu-${id}`);
    
    setConfirmModal({
      isOpen: true,
      title: 'Xác nhận duyệt',
      message: 'Bạn có chắc chắn muốn duyệt món ăn này?',
      type: 'info',
      confirmText: 'Xác nhận',
      cancelText: 'Hủy',
      confirmButtonStyle: 'primary',
      onConfirm: async () => {
        try {
          const response = await menuItemAPI.approveMenuItem(id);
          if (response.success) {
            setPendingMenuItems(pendingMenuItems.filter(m => m.id !== id));
            showSuccess('Thành công', 'Đã duyệt món ăn');
          }
        } catch (error) {
          showError('Lỗi', 'Lỗi khi duyệt món: ' + error.message);
        }
      },
    });
  };

  const handleRejectMenuItem = async (id) => {
    if (processingAction === `reject-menu-${id}`) return; // Prevent double-click
    setProcessingAction(`reject-menu-${id}`);
    
    setConfirmModal({
      isOpen: true,
      title: 'Xác nhận từ chối',
      message: 'Bạn có chắc chắn muốn từ chối món ăn này?',
      type: 'warning',
      confirmText: 'Xác nhận',
      cancelText: 'Hủy',
      confirmButtonStyle: 'danger',
      onConfirm: async () => {
        try {
          const response = await menuItemAPI.rejectMenuItem(id, rejectReason);
          if (response.success) {
            setPendingMenuItems(pendingMenuItems.filter(m => m.id !== id));
            setRejectingItemId(null);
            setRejectReason('');
            showSuccess('Thành công', 'Đã từ chối món ăn');
          }
        } catch (error) {
          showError('Lỗi', 'Lỗi khi từ chối món: ' + error.message);
        } finally {
          setProcessingAction(null);
        }
      },
    });
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
        
        {/* Confirm Modal */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
          onConfirm={confirmModal.onConfirm || (() => {})}
          title={confirmModal.title}
          message={confirmModal.message}
          type={confirmModal.type}
          confirmText={confirmModal.confirmText}
          cancelText={confirmModal.cancelText}
          confirmButtonStyle={confirmModal.confirmButtonStyle}
        />
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <Navbar />
      <main className={styles.mainContent}>
        {/* Back Button */}
        <div className={styles.backButtonWrapper}>
          <button 
            className={styles.backButton}
            onClick={() => navigate(-1)}
            title="Quay lại"
          >
            <FaArrowLeft /> Quay lại
          </button>
        </div>
        
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
              className={`${styles.tab} ${activeTab === 'pendingMenu' ? styles.active : ''}`}
              onClick={() => setActiveTab('pendingMenu')}
            >
              <FaUtensils /> Menu chờ duyệt ({pendingMenuItems.length})
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

          {/* Pending Menu Items Tab */}
          {activeTab === 'pendingMenu' && (
            <div className={styles.pendingList}>
              {pendingMenuItems.length === 0 ? (
                <div className={styles.emptyState}>Không có món ăn nào chờ duyệt</div>
              ) : (
                pendingMenuItems.map((item) => (
                  <div key={item.id} className={styles.pendingCard}>
                    <div className={styles.menuItemImage}>
                      {item.imageUrl ? (
                        <img src={getImageUrl(item.imageUrl)} alt={item.name} />
                      ) : (
                        <div className={styles.noImage}>🍽️</div>
                      )}
                    </div>
                    <div className={styles.pendingInfo}>
                      <h3>{item.name}</h3>
                      <p className={styles.menuItemPrice}>{item.priceFormatted}</p>
                      <p className={styles.pendingCategory}>
                        Danh mục: {item.categoryLabel}
                        {item.isPopular && <span className={styles.popularTag}> ⭐ Popular</span>}
                      </p>
                      <p className={styles.pendingOwner}>
                        Nhà hàng: {item.restaurantName}
                      </p>
                      <p className={styles.pendingOwner}>
                        Owner: {item.ownerName || 'Không xác định'} {item.ownerEmail ? `(${item.ownerEmail})` : ''}
                      </p>
                      <p className={styles.pendingDate}>
                        Ngày gửi: {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <div className={styles.pendingActions}>
                      <button
                        className={styles.approveButton}
                        onClick={() => handleApproveMenuItem(item.id)}
                      >
                        <FaCheck /> Duyệt
                      </button>
                      {rejectingItemId === item.id ? (
                        <div className={styles.rejectForm}>
                          <input
                            type="text"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Lý do từ chối (tùy chọn)"
                            className={styles.rejectInput}
                          />
                          <button
                            className={styles.rejectButton}
                            onClick={() => handleRejectMenuItem(item.id)}
                          >
                            Xác nhận
                          </button>
                          <button
                            className={styles.cancelRejectButton}
                            onClick={() => {
                              setRejectingItemId(null);
                              setRejectReason('');
                            }}
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <button
                          className={styles.rejectButton}
                          onClick={() => setRejectingItemId(item.id)}
                        >
                          <FaTimes /> Từ chối
                        </button>
                      )}
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
      
      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm || (() => {})}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        confirmButtonStyle={confirmModal.confirmButtonStyle}
      />
    </div>
  );
};

export default AdminDashboard;

