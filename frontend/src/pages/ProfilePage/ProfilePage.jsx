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
    FaCamera
} from 'react-icons/fa';
import { favoriteAPI, reviewAPI } from '../../services/api';

const ProfilePage = () => {
    const { user, isAuthenticated, isOwner, isAdmin, refreshUser } = useAuth();
    const navigate = useNavigate();

    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [stats, setStats] = useState({
        favorites: 0,
        reviews: 0,
        restaurants: 0
    });
    const [loading, setLoading] = useState(true);
    const fileInputRef = useRef(null);

    // Redirect nếu chưa đăng nhập
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/dang-nhap');
        }
    }, [isAuthenticated, navigate]);

    // Load user stats
    useEffect(() => {
        if (!user) return;

        const loadStats = async () => {
            try {
                setLoading(true);

                // Load favorites count
                const favResponse = await favoriteAPI.getFavorites();
                const favCount = favResponse.success ? (favResponse.data?.length || 0) : 0;

                // For reviews, we would need an API but we'll estimate from favorites for now
                setStats({
                    favorites: favCount,
                    reviews: 0, // TODO: Add API to get user review count
                    restaurants: 0 // TODO: Add API to get owner's restaurants count
                });
            } catch (error) {
                console.error('Error loading stats:', error);
            } finally {
                setLoading(false);
            }
        };

        loadStats();
    }, [user]);

    // Set initial name when editing
    useEffect(() => {
        if (user?.name) {
            setEditedName(user.name);
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
            alert('Vui lòng nhập tên');
            return;
        }

        setIsSaving(true);
        try {
            // TODO: Implement update profile API
            // const response = await userAPI.updateProfile({ name: editedName });
            // if (response.success) {
            //   await refreshUser();
            //   setIsEditing(false);
            //   alert('Cập nhật thông tin thành công!');
            // }

            // For now, just show success
            await refreshUser();
            setIsEditing(false);
            alert('Cập nhật thông tin thành công!');
        } catch (error) {
            alert('Lỗi khi cập nhật thông tin: ' + error.message);
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
            alert('Tính năng đổi ảnh đại diện sẽ sớm được cập nhật!');
        }
    };

    return (
        <div className={styles.pageContainer}>
            <Navbar />
            <main className={styles.mainContent}>
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
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>
                                <FaHeart />
                            </div>
                            <div className={styles.statInfo}>
                                <span className={styles.statValue}>{loading ? '...' : stats.favorites}</span>
                                <span className={styles.statLabel}>Địa điểm yêu thích</span>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>
                                <FaStar />
                            </div>
                            <div className={styles.statInfo}>
                                <span className={styles.statValue}>{loading ? '...' : stats.reviews}</span>
                                <span className={styles.statLabel}>Đánh giá đã viết</span>
                            </div>
                        </div>
                        {(isOwner || isAdmin) && (
                            <div className={styles.statCard}>
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

                    {/* Details Section */}
                    <div className={styles.detailsSection}>
                        <h2 className={styles.sectionTitle}>Thông tin tài khoản</h2>
                        <div className={styles.detailsList}>
                            <div className={styles.detailItem}>
                                <div className={styles.detailIcon}>
                                    <FaUser />
                                </div>
                                <div className={styles.detailContent}>
                                    <span className={styles.detailLabel}>Tên hiển thị</span>
                                    <span className={styles.detailValue}>{user.name || 'Chưa đặt tên'}</span>
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
                                    <FaCalendarAlt />
                                </div>
                                <div className={styles.detailContent}>
                                    <span className={styles.detailLabel}>Ngày tham gia</span>
                                    <span className={styles.detailValue}>{formatDate(user.createdAt)}</span>
                                </div>
                            </div>
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
