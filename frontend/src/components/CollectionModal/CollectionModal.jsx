import React, { useState } from 'react';
import styles from './CollectionModal.module.css';
import { FiX, FiHeart, FiClock, FiMapPin, FiTrash2 } from 'react-icons/fi';
import { FaStar } from 'react-icons/fa';
import { useCollection } from '../../context/CollectionContext';
import { useNavigate } from 'react-router-dom';

const CollectionModal = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState('checkin'); // 'checkin' | 'recent'
    const navigate = useNavigate();

    const {
        favorites,
        recentSearches,
        removeFavorite,
        removeRecentSearch,
        clearRecentSearches,
        loading
    } = useCollection();

    if (!isOpen) return null;

    const handleLocationClick = (location) => {
        // Đóng modal
        onClose();

        // Navigate đến Discover page và zoom đến location
        navigate(`/kham-pha?restaurant=${location.id}`);

        // Dispatch event để map zoom đến location
        setTimeout(() => {
            window.dispatchEvent(
                new CustomEvent('app:center-map-restaurant', {
                    detail: {
                        latitude: parseFloat(location.latitude),
                        longitude: parseFloat(location.longitude),
                        restaurantId: location.id,
                    },
                })
            );
        }, 100);
    };

    const handleRemoveFavorite = async (e, restaurantId) => {
        e.stopPropagation();
        await removeFavorite(restaurantId);
    };

    const handleRemoveRecent = (e, restaurantId) => {
        e.stopPropagation();
        removeRecentSearch(restaurantId);
    };

    const handleClearRecent = () => {
        clearRecentSearches();
    };

    const renderStars = (rating) => {
        const stars = [];
        const roundedRating = Math.round(rating || 0);
        for (let i = 0; i < 5; i++) {
            stars.push(
                <FaStar
                    key={i}
                    className={i < roundedRating ? styles.starActive : styles.starInactive}
                />
            );
        }
        return stars;
    };

    const renderLocationItem = (location, type) => (
        <div
            key={location.id}
            className={styles.locationItem}
            onClick={() => handleLocationClick(location)}
        >
            <div className={styles.locationImage}>
                {location.image ? (
                    <img
                        src={location.image}
                        alt={location.name}
                        onError={(e) => {
                            e.target.style.display = 'none';
                        }}
                    />
                ) : (
                    <div className={styles.imagePlaceholder}>
                        <FiMapPin />
                    </div>
                )}
            </div>

            <div className={styles.locationInfo}>
                <h4 className={styles.locationName}>{location.name}</h4>
                {location.address && (
                    <p className={styles.locationAddress}>{location.address}</p>
                )}
                <div className={styles.locationMeta}>
                    {location.rating > 0 && (
                        <div className={styles.ratingRow}>
                            {renderStars(location.rating)}
                            <span className={styles.ratingValue}>{location.rating?.toFixed(1)}</span>
                        </div>
                    )}
                    {location.category && (
                        <span className={styles.category}>{location.category}</span>
                    )}
                </div>
                {type === 'recent' && location.viewedAt && (
                    <p className={styles.viewedAt}>
                        <FiClock />
                        {new Date(location.viewedAt).toLocaleString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </p>
                )}
            </div>

            <button
                className={styles.removeButton}
                onClick={(e) => type === 'checkin'
                    ? handleRemoveFavorite(e, location.id)
                    : handleRemoveRecent(e, location.id)
                }
                aria-label="Xóa"
            >
                <FiTrash2 />
            </button>
        </div>
    );

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <header className={styles.header}>
                    <h2>Bộ sưu tập</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        <FiX />
                    </button>
                </header>

                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'checkin' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('checkin')}
                    >
                        <FiHeart />
                        Check-in
                        {favorites.length > 0 && (
                            <span className={styles.badge}>{favorites.length}</span>
                        )}
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'recent' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('recent')}
                    >
                        <FiClock />
                        Tìm kiếm gần đây
                        {recentSearches.length > 0 && (
                            <span className={styles.badge}>{recentSearches.length}</span>
                        )}
                    </button>
                </div>

                <div className={styles.content}>
                    {loading ? (
                        <div className={styles.loading}>
                            <div className={styles.spinner}></div>
                            <p>Đang tải...</p>
                        </div>
                    ) : activeTab === 'checkin' ? (
                        <>
                            {favorites.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <FiHeart className={styles.emptyIcon} />
                                    <h3>Chưa có địa điểm yêu thích</h3>
                                    <p>Nhấn vào biểu tượng 💗 trên các địa điểm bạn muốn lưu lại.</p>
                                </div>
                            ) : (
                                <div className={styles.locationList}>
                                    {favorites.map(location => renderLocationItem(location, 'checkin'))}
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {recentSearches.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <FiClock className={styles.emptyIcon} />
                                    <h3>Không có lịch sử</h3>
                                    <p>Các địa điểm bạn click xem sẽ hiển thị ở đây.</p>
                                </div>
                            ) : (
                                <>
                                    <div className={styles.recentHeader}>
                                        <span>{recentSearches.length} địa điểm</span>
                                        <button
                                            className={styles.clearButton}
                                            onClick={handleClearRecent}
                                        >
                                            Xóa tất cả
                                        </button>
                                    </div>
                                    <div className={styles.locationList}>
                                        {recentSearches.map(location => renderLocationItem(location, 'recent'))}
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CollectionModal;
