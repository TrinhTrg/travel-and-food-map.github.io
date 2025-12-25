import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import styles from './ProfilePage.module.css';
import {
    FaUser,
    FaEnvelope,
    FaCalendarAlt,
    FaEdit,
    FaSave,
    FaTimes,
    FaStore,
    FaStar,
    FaHeart,
    FaUserShield,
    FaUserTie,
    FaCamera,
    FaPhone,
    FaArrowLeft
} from 'react-icons/fa';
import { favoriteAPI, reviewAPI, authAPI, restaurantAPI } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

const ProfilePage = () => {
    const { user, isAuthenticated, isOwner, isAdmin, refreshUser, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { showSuccess, showError, showInfo } = useNotification();

    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState('');
    const [editedPhoneNumber, setEditedPhoneNumber] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [stats, setStats] = useState({
        favorites: 0,
        reviews: 0,
        restaurants: 0
    });
    const [loading, setLoading] = useState(true);
    const fileInputRef = useRef(null);
    
    // State for managing list view
    const [activeListView, setActiveListView] = useState(null); // 'favorites', 'reviews', 'restaurants'
    const [listData, setListData] = useState([]);
    const [listLoading, setListLoading] = useState(false);

    // Redirect nếu chưa đăng nhập (chỉ khi đã hoàn thành loading)
    useEffect(() => {
        // Đợi AuthContext hoàn thành việc kiểm tra token trước khi redirect
        // Chỉ redirect khi đã hoàn thành loading và user chưa đăng nhập
        if (!authLoading && !isAuthenticated) {
            navigate('/dang-nhap');
        }
    }, [isAuthenticated, authLoading, navigate]);

    // Load user stats
    useEffect(() => {
        if (!user) return;

        const loadStats = async () => {
            try {
                setLoading(true);

                // Load favorites count
                const favResponse = await favoriteAPI.getFavorites();
                const favCount = favResponse.success ? (favResponse.data?.length || 0) : 0;

                // Load reviews count
                let reviewCount = 0;
                try {
                    const reviewResponse = await reviewAPI.getUserReviewCount();
                    if (reviewResponse.success) {
                        reviewCount = reviewResponse.data?.count || 0;
                    }
                } catch (error) {
                    console.error('Error loading review count:', error);
                }

                // Load restaurants count (only for owners/admins)
                let restaurantCount = 0;
                if (isOwner || isAdmin) {
                    try {
                        // Admin: lấy tổng số nhà hàng, Owner: lấy nhà hàng của owner
                        const restaurantResponse = isAdmin 
                            ? await restaurantAPI.getAllRestaurants()
                            : await restaurantAPI.getOwnerRestaurants();
                        if (restaurantResponse.success) {
                            restaurantCount = restaurantResponse.data?.length || restaurantResponse.count || 0;
                        }
                    } catch (error) {
                        console.error('Error loading restaurants count:', error);
                    }
                }

                setStats({
                    favorites: favCount,
                    reviews: reviewCount,
                    restaurants: restaurantCount
                });
            } catch (error) {
                console.error('Error loading stats:', error);
            } finally {
                setLoading(false);
            }
        };

        loadStats();
    }, [user, isOwner, isAdmin]);

    // Refresh user data khi component mount để đảm bảo có phone_number mới nhất
    useEffect(() => {
        if (isAuthenticated) {
            refreshUser();
        }
    }, [isAuthenticated, refreshUser]);

    // Set initial values when editing
    useEffect(() => {
        if (user) {
            setEditedName(user.name || '');
            setEditedPhoneNumber(user.phone_number || '');
        }
    }, [user]);

    if (!isAuthenticated || !user) {
        return null;
    }

    const getRoleBadge = () => {
        if (isAdmin) {
            return (
                <span className={`${styles.roleBadge} ${styles.roleAdmin}`}>
                    <FaUserShield /> Admin
                </span>
            );
        }
        if (isOwner) {
            return (
                <span className={`${styles.roleBadge} ${styles.roleOwner}`}>
                    <FaUserTie /> Owner
                </span>
            );
        }
        return (
            <span className={`${styles.roleBadge} ${styles.roleUser}`}>
                <FaUser /> Người dùng
            </span>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Không xác định';
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleSaveProfile = async () => {
        if (!editedName.trim()) {
            showError('Lỗi', 'Vui lòng nhập tên');
            return;
        }

        setIsSaving(true);
        try {
            const response = await authAPI.updateProfile({ 
                name: editedName.trim(),
                phone_number: editedPhoneNumber.trim() || null
            });
            
            if (response.success) {
                await refreshUser();
                setIsEditing(false);
                showSuccess('Thành công', 'Cập nhật thông tin thành công!');
            } else {
                throw new Error(response.message || 'Cập nhật thất bại');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            showError('Lỗi', 'Lỗi khi cập nhật thông tin: ' + (error.message || 'Vui lòng thử lại'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            // TODO: Implement avatar upload
            showInfo('Thông báo', 'Tính năng đổi ảnh đại diện sẽ sớm được cập nhật!');
        }
    };

    const handleStatCardClick = async (type) => {
        // Toggle: nếu đang active thì đóng, nếu không thì mở
        if (activeListView === type) {
            setActiveListView(null);
            setListData([]);
            return;
        }

        setActiveListView(type);
        setListLoading(true);
        setListData([]);

        try {
            if (type === 'favorites') {
                const response = await favoriteAPI.getFavorites();
                if (response.success) {
                    setListData(response.data || []);
                }
            } else if (type === 'reviews') {
                const response = await reviewAPI.getUserReviews();
                if (response.success) {
                    setListData(response.data || []);
                }
            } else if (type === 'restaurants') {
                // Admin: lấy tất cả nhà hàng, Owner: lấy nhà hàng của owner
                const response = isAdmin 
                    ? await restaurantAPI.getAllRestaurants()
                    : await restaurantAPI.getOwnerRestaurants();
                if (response.success) {
                    setListData(response.data || []);
                }
            }
        } catch (error) {
            console.error(`Error loading ${type}:`, error);
            showError('Lỗi', `Lỗi khi tải dữ liệu: ${error.message}`);
        } finally {
            setListLoading(false);
        }
    };

    // Hiển thị loading khi đang kiểm tra authentication
    if (authLoading) {
        return (
            <div className={styles.pageContainer}>
                <Navbar />
                <main className={styles.mainContent}>
                    <div className={styles.loadingContainer}>
                        <div className={styles.loadingSpinner}></div>
                        <p>Đang tải...</p>
                    </div>
                </main>
            </div>
        );
    }

    // Nếu không đăng nhập sau khi đã load xong, sẽ redirect (useEffect đã xử lý)
    if (!isAuthenticated) {
        return null; // Return null để tránh flash content trước khi redirect
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
                
                <div className={styles.profileContainer}>
                    {/* Header Section */}
                    <div className={styles.profileHeader}>
                        <div className={styles.headerBackground}></div>
                        <div className={styles.headerContent}>
                            {/* Avatar */}
                            <div className={styles.avatarSection}>
                                <div className={styles.avatarWrapper} onClick={handleAvatarClick}>
                                    <div className={styles.avatar}>
                                        {user.avatar ? (
                                            <img src={user.avatar} alt={user.name} />
                                        ) : (
                                            <span className={styles.avatarInitial}>
                                                {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div className={styles.avatarOverlay}>
                                        <FaCamera />
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                        style={{ display: 'none' }}
                                    />
                                </div>
                            </div>

                            {/* User Info */}
                            <div className={styles.userInfoSection}>
                                {isEditing ? (
                                    <div className={styles.editNameSection}>
                                        <input
                                            type="text"
                                            value={editedName}
                                            onChange={(e) => setEditedName(e.target.value)}
                                            className={styles.nameInput}
                                            placeholder="Nhập tên của bạn"
                                            autoFocus
                                        />
                                        <div className={styles.editActions}>
                                            <button
                                                className={styles.saveBtn}
                                                onClick={handleSaveProfile}
                                                disabled={isSaving}
                                            >
                                                <FaSave /> {isSaving ? 'Đang lưu...' : 'Lưu'}
                                            </button>
                                            <button
                                                className={styles.cancelBtn}
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    setEditedName(user.name || '');
                                                }}
                                            >
                                                <FaTimes /> Hủy
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <h1 className={styles.userName}>
                                            {user.name || 'Chưa đặt tên'}
                                            <button
                                                className={styles.editNameBtn}
                                                onClick={() => setIsEditing(true)}
                                                title="Chỉnh sửa tên"
                                            >
                                                <FaEdit />
                                            </button>
                                        </h1>
                                    </>
                                )}
                                <p className={styles.userEmail}>{user.email}</p>
                                {getRoleBadge()}
                            </div>
                        </div>
                    </div>

                    {/* Stats Section */}
                    <div className={styles.statsSection}>
                        <div 
                            className={`${styles.statCard} ${activeListView === 'favorites' ? styles.active : ''}`}
                            onClick={() => handleStatCardClick('favorites')}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className={styles.statIcon}>
                                <FaHeart />
                            </div>
                            <div className={styles.statInfo}>
                                <span className={styles.statValue}>{loading ? '...' : stats.favorites}</span>
                                <span className={styles.statLabel}>Địa điểm yêu thích</span>
                            </div>
                        </div>
                        <div 
                            className={`${styles.statCard} ${activeListView === 'reviews' ? styles.active : ''}`}
                            onClick={() => handleStatCardClick('reviews')}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className={styles.statIcon}>
                                <FaStar />
                            </div>
                            <div className={styles.statInfo}>
                                <span className={styles.statValue}>{loading ? '...' : stats.reviews}</span>
                                <span className={styles.statLabel}>Đánh giá đã viết</span>
                            </div>
                        </div>
                        {(isOwner || isAdmin) && (
                            <div 
                                className={`${styles.statCard} ${activeListView === 'restaurants' ? styles.active : ''}`}
                                onClick={() => handleStatCardClick('restaurants')}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className={styles.statIcon}>
                                    <FaStore />
                                </div>
                                <div className={styles.statInfo}>
                                    <span className={styles.statValue}>{loading ? '...' : stats.restaurants}</span>
                                    <span className={styles.statLabel}>Nhà hàng quản lý</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* List View Section */}
                    {activeListView && (
                        <div className={styles.listViewSection}>
                            <div className={styles.listViewHeader}>
                                <h2 className={styles.listViewTitle}>
                                    {activeListView === 'favorites' && 'Địa điểm yêu thích'}
                                    {activeListView === 'reviews' && 'Đánh giá đã viết'}
                                    {activeListView === 'restaurants' && 'Nhà hàng quản lý'}
                                </h2>
                                <button
                                    className={styles.closeListViewBtn}
                                    onClick={() => {
                                        setActiveListView(null);
                                        setListData([]);
                                    }}
                                >
                                    <FaTimes />
                                </button>
                            </div>
                            
                            {listLoading ? (
                                <div className={styles.listLoading}>
                                    <div className={styles.loadingSpinner}></div>
                                    <p>Đang tải...</p>
                                </div>
                            ) : listData.length === 0 ? (
                                <div className={styles.emptyList}>
                                    <p>Chưa có dữ liệu</p>
                                </div>
                            ) : (
                                <div className={styles.listContent}>
                                    {listData.map((item) => {
                                        if (activeListView === 'favorites') {
                                            // API trả về: { id, name, address, image, ... }
                                            return (
                                                <div 
                                                    key={item.id || item.favoriteId} 
                                                    className={styles.listItem}
                                                    onClick={() => navigate(`/kham-pha?restaurant=${item.id}`)}
                                                >
                                                    {item.image && (
                                                        <img 
                                                            src={item.image} 
                                                            alt={item.name}
                                                            className={styles.listItemImage}
                                                        />
                                                    )}
                                                    <div className={styles.listItemContent}>
                                                        <h3>{item.name || 'Không có tên'}</h3>
                                                        <p>{item.address || 'Không có địa chỉ'}</p>
                                                    </div>
                                                </div>
                                            );
                                        } else if (activeListView === 'reviews') {
                                            return (
                                                <div 
                                                    key={item.id} 
                                                    className={styles.listItem}
                                                    onClick={() => navigate(`/kham-pha?restaurant=${item.restaurant?.id}`)}
                                                >
                                                    {item.restaurant?.image_url && (
                                                        <img 
                                                            src={item.restaurant.image_url} 
                                                            alt={item.restaurant.name}
                                                            className={styles.listItemImage}
                                                        />
                                                    )}
                                                    <div className={styles.listItemContent}>
                                                        <h3>{item.restaurant?.name || 'Không có tên'}</h3>
                                                        <div className={styles.reviewInfo}>
                                                            <div className={styles.ratingStars}>
                                                                {[...Array(5)].map((_, i) => (
                                                                    <FaStar 
                                                                        key={i} 
                                                                        className={i < item.rating ? styles.starFilled : styles.starEmpty}
                                                                    />
                                                                ))}
                                                            </div>
                                                            <p className={styles.reviewContent}>{item.content || 'Không có nội dung'}</p>
                                                            <span className={styles.reviewDate}>{item.relativeTime || formatDate(item.createdAt)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        } else if (activeListView === 'restaurants') {
                                            return (
                                                <div 
                                                    key={item.id} 
                                                    className={styles.listItem}
                                                    onClick={() => navigate(`/kham-pha?restaurant=${item.id}`)}
                                                >
                                                    {item.image_url && (
                                                        <img 
                                                            src={item.image_url} 
                                                            alt={item.name}
                                                            className={styles.listItemImage}
                                                        />
                                                    )}
                                                    <div className={styles.listItemContent}>
                                                        <h3>{item.name || 'Không có tên'}</h3>
                                                        <p>{item.address || 'Không có địa chỉ'}</p>
                                                        <div className={styles.restaurantStatus}>
                                                            <span className={`${styles.statusBadge} ${(item.statusRaw === 'approved' || item.status === 'Đã duyệt') ? styles.approved : styles.pending}`}>
                                                                {item.status || (item.statusRaw === 'approved' ? 'Đã duyệt' : 'Chờ duyệt')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Details Section */}
                    <div className={styles.detailsSection}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>Thông tin tài khoản</h2>
                            {!isEditing && (
                                <button
                                    className={styles.editSectionButton}
                                    onClick={() => setIsEditing(true)}
                                    title="Chỉnh sửa thông tin"
                                >
                                    <FaEdit /> Chỉnh sửa
                                </button>
                            )}
                        </div>
                        <div className={styles.detailsList}>
                            <div className={styles.detailItem}>
                                <div className={styles.detailIcon}>
                                    <FaUser />
                                </div>
                                <div className={styles.detailContent}>
                                    <span className={styles.detailLabel}>Tên hiển thị</span>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editedName}
                                            onChange={(e) => setEditedName(e.target.value)}
                                            className={styles.detailInput}
                                            placeholder="Nhập tên của bạn"
                                        />
                                    ) : (
                                        <span className={styles.detailValue}>{user.name || 'Chưa đặt tên'}</span>
                                    )}
                                </div>
                            </div>

                            <div className={styles.detailItem}>
                                <div className={styles.detailIcon}>
                                    <FaEnvelope />
                                </div>
                                <div className={styles.detailContent}>
                                    <span className={styles.detailLabel}>Email</span>
                                    <span className={styles.detailValue}>{user.email}</span>
                                </div>
                            </div>

                            <div className={styles.detailItem}>
                                <div className={styles.detailIcon}>
                                    <FaPhone />
                                </div>
                                <div className={styles.detailContent}>
                                    <span className={styles.detailLabel}>Số điện thoại</span>
                                    {isEditing ? (
                                        <input
                                            type="tel"
                                            value={editedPhoneNumber}
                                            onChange={(e) => setEditedPhoneNumber(e.target.value)}
                                            className={styles.detailInput}
                                            placeholder="VD: +84 961 239 797"
                                        />
                                    ) : (
                                        <span className={styles.detailValue}>
                                            {user.phone_number || 'Chưa cập nhật'}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className={styles.detailItem}>
                                <div className={styles.detailIcon}>
                                    <FaCalendarAlt />
                                </div>
                                <div className={styles.detailContent}>
                                    <span className={styles.detailLabel}>Ngày tham gia</span>
                                    <span className={styles.detailValue}>{formatDate(user.createdAt)}</span>
                                </div>
                            </div>

                            {isEditing && (
                                <div className={styles.editActions}>
                                    <button
                                        className={styles.saveButton}
                                        onClick={handleSaveProfile}
                                        disabled={isSaving}
                                    >
                                        <FaSave /> {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                                    </button>
                                    <button
                                        className={styles.cancelButton}
                                        onClick={() => {
                                            setIsEditing(false);
                                            setEditedName(user.name || '');
                                            setEditedPhoneNumber(user.phone_number || '');
                                        }}
                                        disabled={isSaving}
                                    >
                                        <FaTimes /> Hủy
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className={styles.actionsSection}>
                        <h2 className={styles.sectionTitle}>Hành động nhanh</h2>
                        <div className={styles.actionButtons}>
                            <button
                                className={styles.actionBtn}
                                onClick={() => navigate('/kham-pha')}
                            >
                                <FaHeart />
                                <span>Địa điểm yêu thích</span>
                            </button>
                            {(isOwner || isAdmin) && (
                                <button
                                    className={styles.actionBtn}
                                    onClick={() => navigate('/create-location')}
                                >
                                    <FaStore />
                                    <span>Tạo nhà hàng</span>
                                </button>
                            )}
                            {isAdmin && (
                                <button
                                    className={`${styles.actionBtn} ${styles.adminBtn}`}
                                    onClick={() => navigate('/admin/dashboard')}
                                >
                                    <FaUserShield />
                                    <span>Admin Dashboard</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default ProfilePage;
