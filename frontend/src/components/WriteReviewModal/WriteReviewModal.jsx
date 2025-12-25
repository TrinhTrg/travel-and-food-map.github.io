import React, { useState, useRef, useEffect } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import styles from './WriteReviewModal.module.css';
import { searchAPI } from '../../services/api';

const WriteReviewModal = ({ isOpen, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchSuggestions, setSearchSuggestions] = useState({ restaurants: [], categories: [] });
    const [isSearching, setIsSearching] = useState(false);
    const searchInputRef = useRef(null);
    const navigate = useNavigate();

    // Auto-focus khi modal mở
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            // Delay nhỏ để đảm bảo modal đã render xong
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    // Search autocomplete với debounce
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchSuggestions({ restaurants: [], categories: [] });
            return;
        }

        const timeoutId = setTimeout(async () => {
            try {
                setIsSearching(true);
                const response = await searchAPI.autocomplete(searchQuery, 10);
                if (response.success) {
                    setSearchSuggestions(response.data);
                }
            } catch (error) {
                console.error('Search error:', error);
                setSearchSuggestions({ restaurants: [], categories: [] });
            } finally {
                setIsSearching(false);
            }
        }, 300); // Debounce 300ms

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    // Đóng modal khi nhấn ESC
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                handleClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            // Prevent body scroll khi modal mở
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleClose = () => {
        setSearchQuery('');
        setSearchSuggestions({ restaurants: [], categories: [] });
        onClose();
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleSuggestionClick = (restaurant) => {
        // Đóng modal
        handleClose();

        // Scroll window lên top trước khi navigate (nếu đang ở trang khác)
        window.scrollTo({ top: 0, behavior: 'instant' });

        // Dispatch event để zoom map vào restaurant và mở popup
        if (restaurant.latitude && restaurant.longitude) {
            window.dispatchEvent(
                new CustomEvent('app:center-map-restaurant', {
                    detail: {
                        latitude: restaurant.latitude,
                        longitude: restaurant.longitude,
                        restaurantId: restaurant.id,
                    },
                })
            );
        }

        // Navigate đến DiscoverPage với restaurant id
        navigate(`/kham-pha?restaurant=${restaurant.id}`, {
            preventScrollReset: true,
        });
    };

    const handleBackdropClick = (e) => {
        // Chỉ đóng khi click vào backdrop, không phải modal content
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    if (!isOpen) return null;

    const hasResults = searchSuggestions.restaurants.length > 0 || searchSuggestions.categories.length > 0;

    return (
        <div className={styles.modalBackdrop} onClick={handleBackdropClick}>
            <div className={styles.modalContent}>
                {/* Header */}
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Tìm địa điểm</h2>
                    <button
                        className={styles.closeButton}
                        onClick={handleClose}
                        aria-label="Đóng modal"
                    >
                        <FiX />
                    </button>
                </div>

                {/* Search Bar - Style tối giản như Navbar */}
                <div className={styles.searchBarWrapper}>
                    <div className={styles.searchBar}>
                        <FiSearch className={styles.searchIcon} />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Nhập tên địa điểm mà bạn muốn viết Bình luận"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className={styles.searchInput}
                        />
                    </div>

                    {/* Instruction Text */}
                    <p className={styles.instructionText}>
                        Nếu không tìm thấy, bạn vui lòng sử dụng công cụ tìm kiếm thông minh hơn{' '}
                        <span className={styles.highlightText}>tại đây</span>
                    </p>
                </div>

                {/* Search Results */}
                <div className={styles.searchResults}>
                    {/* Loading State */}
                    {isSearching && (
                        <div className={styles.loadingState}>
                            <div className={styles.loadingSpinner}></div>
                            <p>Đang tìm kiếm...</p>
                        </div>
                    )}

                    {/* Results */}
                    {!isSearching && hasResults && (
                        <>
                            {/* Restaurants Section */}
                            {searchSuggestions.restaurants.length > 0 && (
                                <div className={styles.resultsSection}>
                                    <h3 className={styles.resultsSectionTitle}>Địa điểm</h3>
                                    <div className={styles.resultsList}>
                                        {searchSuggestions.restaurants.map((restaurant) => (
                                            <div
                                                key={restaurant.id}
                                                className={styles.resultItem}
                                                onClick={() => handleSuggestionClick(restaurant)}
                                            >
                                                {restaurant.image && (
                                                    <img
                                                        src={restaurant.image}
                                                        alt={restaurant.name}
                                                        className={styles.resultImage}
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                        }}
                                                    />
                                                )}
                                                <div className={styles.resultInfo}>
                                                    <div className={styles.resultName}>{restaurant.name}</div>
                                                    {restaurant.address && (
                                                        <div className={styles.resultAddress}>{restaurant.address}</div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* No Results */}
                    {!isSearching && !hasResults && searchQuery.trim() && (
                        <div className={styles.noResults}>
                            <p>Không tìm thấy kết quả</p>
                            <p className={styles.noResultsSubtext}>
                                Hãy thử tìm kiếm với từ khóa khác hoặc sử dụng công cụ tìm kiếm nâng cao
                            </p>
                        </div>
                    )}

                    {/* Empty State */}
                    {!isSearching && !searchQuery.trim() && (
                        <div className={styles.emptyState}>
                            <FiSearch className={styles.emptyStateIcon} />
                            <p>Nhập tên địa điểm để bắt đầu tìm kiếm</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WriteReviewModal;
