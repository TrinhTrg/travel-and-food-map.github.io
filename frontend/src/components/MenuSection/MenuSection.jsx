import React, { useState, useEffect, useCallback } from 'react';
import { FaChevronLeft, FaChevronRight, FaTimes, FaFire, FaEdit, FaPlus } from 'react-icons/fa';
import { menuItemAPI } from '../../services/api';
import MenuItemModal from './MenuItemModal';
import styles from './MenuSection.module.css';

const BACKEND_URL = 'http://localhost:3000';

const MenuSection = ({ restaurantId, isOwner }) => {
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAll, setShowAll] = useState(false);
    const [zoomedItem, setZoomedItem] = useState(null);
    const [zoomedIndex, setZoomedIndex] = useState(0);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const ITEMS_PER_VIEW = 4;

    // Helper để lấy full URL cho ảnh
    const getImageUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('http') || url.startsWith('blob:')) return url;
        return `${BACKEND_URL}${url}`;
    };

    // Load menu items
    const loadMenu = useCallback(async () => {
        if (!restaurantId) return;

        setLoading(true);
        try {
            const response = await menuItemAPI.getMenuByRestaurant(restaurantId);
            if (response.success) {
                setMenuItems(response.data || []);
            }
        } catch (error) {
            console.error('Error loading menu:', error);
        } finally {
            setLoading(false);
        }
    }, [restaurantId]);

    useEffect(() => {
        loadMenu();
    }, [loadMenu]);

    // Navigation handlers
    const handlePrev = () => {
        setCurrentIndex(prev => Math.max(0, prev - 1));
    };

    const handleNext = () => {
        const maxIndex = Math.max(0, menuItems.length - ITEMS_PER_VIEW);
        setCurrentIndex(prev => Math.min(maxIndex, prev + 1));
    };

    // Zoom handlers
    const openZoom = (item, index) => {
        setZoomedItem(item);
        setZoomedIndex(index);
    };

    const closeZoom = () => {
        setZoomedItem(null);
    };

    const zoomPrev = (e) => {
        e.stopPropagation();
        const newIndex = zoomedIndex > 0 ? zoomedIndex - 1 : menuItems.length - 1;
        setZoomedIndex(newIndex);
        setZoomedItem(menuItems[newIndex]);
    };

    const zoomNext = (e) => {
        e.stopPropagation();
        const newIndex = zoomedIndex < menuItems.length - 1 ? zoomedIndex + 1 : 0;
        setZoomedIndex(newIndex);
        setZoomedItem(menuItems[newIndex]);
    };

    // Editing handlers
    const handleEditStart = (e, item) => {
        e.stopPropagation();
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleAddStart = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const handleModalSuccess = (action) => {
        loadMenu();
    };

    // Keyboard navigation for zoom
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!zoomedItem) return;
            if (e.key === 'Escape') closeZoom();
            if (e.key === 'ArrowLeft') zoomPrev(e);
            if (e.key === 'ArrowRight') zoomNext(e);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [zoomedItem, zoomedIndex, menuItems]);

    // Loading state handling
    if (loading && menuItems.length === 0) {
        return (
            <section className={styles.menuSection}>
                <div className={styles.sectionHeader}>
                    <h4>Menu của nhà hàng</h4>
                </div>
                <div className={styles.loading}>Đang tải menu...</div>
            </section>
        );
    }

    if (menuItems.length === 0 && !isOwner) {
        return null;
    }

    const visibleItems = menuItems;

    const canGoPrev = currentIndex > 0;
    const canGoNext = currentIndex < menuItems.length - 1;

    return (
        <section className={styles.menuSection}>
            <div className={styles.sectionHeader}>
                <h4>Menu của nhà hàng</h4>
                {menuItems.length > 0 && <span>{menuItems.length} món</span>}
            </div>

            {/* Menu Grid/Carousel */}
            <div className={styles.menuContainer}>
                {!showAll && menuItems.length > ITEMS_PER_VIEW && (
                    <>
                        <button
                            className={`${styles.navButton} ${styles.navPrev}`}
                            onClick={handlePrev}
                            disabled={!canGoPrev}
                            aria-label="Previous"
                        >
                            <FaChevronLeft />
                        </button>
                        <button
                            className={`${styles.navButton} ${styles.navNext}`}
                            onClick={handleNext}
                            disabled={!canGoNext}
                            aria-label="Next"
                        >
                            <FaChevronRight />
                        </button>
                    </>
                )}

                <div className={`${styles.menuGrid} ${showAll ? styles.menuGridExpanded : ''}`}>
                    {visibleItems.map((item, idx) => (
                        <div
                            key={item.id}
                            className={styles.menuCard}
                            onClick={() => openZoom(item, showAll ? idx : currentIndex + idx)}
                        >
                            <div className={styles.menuImageWrapper}>
                                {item.imageUrl ? (
                                    <img
                                        src={getImageUrl(item.imageUrl)}
                                        alt={item.name}
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className={styles.noImage}>🍽️</div>
                                )}

                                {/* Badges */}
                                <div className={styles.badgesContainer}>
                                    {item.isPopular && (
                                        <span className={styles.popularBadge}>
                                            <FaFire /> Popular
                                        </span>
                                    )}
                                    {isOwner && item.status === 'pending_approval' && (
                                        <span className={`${styles.statusBadge} ${styles.statusPending}`}>
                                            Chờ duyệt
                                        </span>
                                    )}
                                    {isOwner && item.status === 'rejected' && (
                                        <span className={`${styles.statusBadge} ${styles.statusRejected}`}>
                                            Từ chối
                                        </span>
                                    )}
                                </div>

                                {/* Edit Button for Owner */}
                                {isOwner && (
                                    <button
                                        className={styles.editButton}
                                        onClick={(e) => handleEditStart(e, item)}
                                        title="Sửa món ăn"
                                    >
                                        <FaEdit />
                                    </button>
                                )}

                                <div className={styles.menuOverlay}>
                                    <span className={styles.menuName}>{item.name}</span>
                                </div>
                            </div>
                            <div className={styles.menuInfo}>
                                <span className={styles.menuPrice}>{item.priceFormatted}</span>
                                <span className={styles.menuCategory}>{item.categoryLabel}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {menuItems.length === 0 && isOwner && (
                    <div className={styles.emptyState}>
                        <p>Menu đang trống. Hãy thêm món ăn đầu tiên!</p>
                    </div>
                )}
            </div>

            {/* See More Button */}
            {menuItems.length > ITEMS_PER_VIEW && (
                <button
                    className={styles.seeMoreButton}
                    onClick={() => setShowAll(!showAll)}
                >
                    {showAll ? 'Thu gọn' : `Xem thêm (${menuItems.length - ITEMS_PER_VIEW} món)`}
                </button>
            )}

            {/* Add Menu Button for Owner */}
            {isOwner && (
                <button
                    className={styles.addMenuButton}
                    onClick={handleAddStart}
                >
                    <FaPlus /> Thêm món mới
                </button>
            )}

            {/* Zoom Modal */}
            {zoomedItem && (
                <div className={styles.zoomOverlay} onClick={closeZoom}>
                    <div className={styles.zoomContent} onClick={e => e.stopPropagation()}>
                        <button className={styles.zoomClose} onClick={closeZoom}>
                            <FaTimes />
                        </button>

                        <div className={styles.zoomImageWrapper}>
                            {zoomedItem.imageUrl ? (
                                <img
                                    src={getImageUrl(zoomedItem.imageUrl)}
                                    alt={zoomedItem.name}
                                />
                            ) : (
                                <div className={styles.zoomNoImage}>🍽️</div>
                            )}

                            {/* Navigation */}
                            {menuItems.length > 1 && (
                                <>
                                    <button className={styles.zoomNav} onClick={zoomPrev}>
                                        <FaChevronLeft />
                                    </button>
                                    <button className={`${styles.zoomNav} ${styles.zoomNavRight}`} onClick={zoomNext}>
                                        <FaChevronRight />
                                    </button>
                                </>
                            )}
                        </div>

                        <div className={styles.zoomInfo}>
                            <h3>{zoomedItem.name}</h3>
                            <div className={styles.zoomMeta}>
                                <span className={styles.zoomPrice}>{zoomedItem.priceFormatted}</span>
                                <span className={styles.zoomCategory}>{zoomedItem.categoryLabel}</span>
                                {zoomedItem.isPopular && (
                                    <span className={styles.zoomPopular}>
                                        <FaFire /> Popular
                                    </span>
                                )}
                            </div>
                            <span className={styles.zoomCounter}>
                                {zoomedIndex + 1} / {menuItems.length}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            <MenuItemModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                item={editingItem}
                restaurantId={restaurantId}
                onSuccess={handleModalSuccess}
            />
        </section>
    );
};

export default MenuSection;
