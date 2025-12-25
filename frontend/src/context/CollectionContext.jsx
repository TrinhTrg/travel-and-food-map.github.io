import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { favoriteAPI } from '../services/api';

const CollectionContext = createContext(null);

// Số lượng tối đa địa điểm tìm kiếm gần đây
const MAX_RECENT_SEARCHES = 10;

export const CollectionProvider = ({ children }) => {
    // Danh sách địa điểm yêu thích (check-in) - lưu trong database
    const [favorites, setFavorites] = useState([]);
    // Danh sách ID của địa điểm yêu thích (để kiểm tra nhanh)
    const [favoriteIds, setFavoriteIds] = useState(new Set());
    // Danh sách tìm kiếm gần đây - lưu trong localStorage theo user
    const [recentSearches, setRecentSearches] = useState([]);
    // Loading state
    const [loading, setLoading] = useState(false);

    const { isAuthenticated, user } = useAuth();

    // Key cho localStorage dựa trên user ID
    const getStorageKey = useCallback(() => {
        if (!user?.id) return null;
        return `recentSearches_${user.id}`;
    }, [user?.id]);

    // Load favorites từ API khi user đăng nhập
    useEffect(() => {
        const loadFavorites = async () => {
            if (!isAuthenticated) {
                setFavorites([]);
                setFavoriteIds(new Set());
                return;
            }

            try {
                setLoading(true);
                const response = await favoriteAPI.getFavorites();
                if (response.success) {
                    setFavorites(response.data || []);
                    const ids = new Set((response.data || []).map(fav => fav.id));
                    setFavoriteIds(ids);
                }
            } catch (error) {
                console.error('Error loading favorites:', error);
            } finally {
                setLoading(false);
            }
        };

        loadFavorites();
    }, [isAuthenticated]);

    // Load recent searches từ localStorage khi user đăng nhập
    useEffect(() => {
        if (!isAuthenticated || !user?.id) {
            setRecentSearches([]);
            return;
        }

        const storageKey = getStorageKey();
        if (storageKey) {
            try {
                const stored = localStorage.getItem(storageKey);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    setRecentSearches(Array.isArray(parsed) ? parsed : []);
                }
            } catch (error) {
                console.error('Error loading recent searches:', error);
                setRecentSearches([]);
            }
        }
    }, [isAuthenticated, user?.id, getStorageKey]);

    // Lưu recent searches vào localStorage khi thay đổi
    useEffect(() => {
        const storageKey = getStorageKey();
        if (storageKey && isAuthenticated) {
            try {
                localStorage.setItem(storageKey, JSON.stringify(recentSearches));
            } catch (error) {
                console.error('Error saving recent searches:', error);
            }
        }
    }, [recentSearches, getStorageKey, isAuthenticated]);

    // Xóa data khi user đăng xuất
    useEffect(() => {
        if (!isAuthenticated) {
            setFavorites([]);
            setFavoriteIds(new Set());
            setRecentSearches([]);
        }
    }, [isAuthenticated]);

    // Thêm địa điểm vào yêu thích
    const addFavorite = useCallback(async (restaurant) => {
        if (!isAuthenticated) {
            return { success: false, message: 'Vui lòng đăng nhập' };
        }

        try {
            const response = await favoriteAPI.addFavorite(restaurant.id);
            if (response.success) {
                // Thêm vào danh sách local
                const newFavorite = {
                    ...restaurant,
                    favoriteId: response.data.id,
                    addedAt: response.data.addedAt
                };
                setFavorites(prev => [newFavorite, ...prev]);
                setFavoriteIds(prev => new Set([...prev, restaurant.id]));
                return { success: true };
            }
            return { success: false, message: response.message };
        } catch (error) {
            console.error('Error adding favorite:', error);
            return { success: false, message: error.message || 'Không thể thêm vào yêu thích' };
        }
    }, [isAuthenticated]);

    // Xóa địa điểm khỏi yêu thích
    const removeFavorite = useCallback(async (restaurantId) => {
        if (!isAuthenticated) {
            return { success: false, message: 'Vui lòng đăng nhập' };
        }

        try {
            const response = await favoriteAPI.removeFavorite(restaurantId);
            if (response.success) {
                setFavorites(prev => prev.filter(fav => fav.id !== restaurantId));
                setFavoriteIds(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(restaurantId);
                    return newSet;
                });
                return { success: true };
            }
            return { success: false, message: response.message };
        } catch (error) {
            console.error('Error removing favorite:', error);
            return { success: false, message: error.message || 'Không thể xóa khỏi yêu thích' };
        }
    }, [isAuthenticated]);

    // Refresh favorites từ API
    const refreshFavorites = useCallback(async () => {
        if (!isAuthenticated) return;

        try {
            setLoading(true);
            const response = await favoriteAPI.getFavorites();
            if (response.success) {
                setFavorites(response.data || []);
                const ids = new Set((response.data || []).map(fav => fav.id));
                setFavoriteIds(ids);
            }
        } catch (error) {
            console.error('Error refreshing favorites:', error);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    // Toggle yêu thích
    const toggleFavorite = useCallback(async (restaurant) => {
        const restaurantId = typeof restaurant === 'object' ? restaurant.id : restaurant;
        
        // Convert ID để so sánh chính xác
        const id = typeof restaurantId === 'string' ? parseInt(restaurantId, 10) : restaurantId;
        const idStr = String(restaurantId);
        
        // Kiểm tra xem đã có trong favoriteIds chưa
        const isCurrentlyFavorite = favoriteIds.has(id) || favoriteIds.has(idStr);

        if (isCurrentlyFavorite) {
            return await removeFavorite(restaurantId);
        } else {
            const restaurantData = typeof restaurant === 'object' ? restaurant : { id: restaurantId };
            try {
                const result = await addFavorite(restaurantData);
                // Nếu API trả về lỗi "đã được thêm", refresh favorites từ server
                if (!result.success && result.message && result.message.includes('đã được thêm')) {
                    await refreshFavorites();
                    return { success: true, message: 'Đã có trong yêu thích' };
                }
                return result;
            } catch (error) {
                // Nếu lỗi là "đã được thêm", refresh favorites
                if (error.message && error.message.includes('đã được thêm')) {
                    await refreshFavorites();
                    return { success: true, message: 'Đã có trong yêu thích' };
                }
                throw error;
            }
        }
    }, [addFavorite, removeFavorite, favoriteIds, refreshFavorites]);

    // Kiểm tra địa điểm có trong yêu thích không
    const isFavorite = useCallback((restaurantId) => {
        // Convert to number for comparison
        const id = typeof restaurantId === 'string' ? parseInt(restaurantId, 10) : restaurantId;
        return favoriteIds.has(id) || favoriteIds.has(String(id));
    }, [favoriteIds]);

    // Thêm địa điểm vào lịch sử tìm kiếm gần đây
    const addRecentSearch = useCallback((restaurant) => {
        if (!isAuthenticated || !restaurant) return;

        setRecentSearches(prev => {
            // Kiểm tra nếu đã tồn tại thì chuyển lên đầu
            const filtered = prev.filter(item => item.id !== restaurant.id);

            // Thêm vào đầu danh sách
            const newList = [
                {
                    id: restaurant.id,
                    name: restaurant.name,
                    address: restaurant.address,
                    latitude: restaurant.latitude,
                    longitude: restaurant.longitude,
                    image: restaurant.image || restaurant.image_url || restaurant.bannerImage,
                    category: restaurant.category,
                    rating: restaurant.rating,
                    viewedAt: new Date().toISOString()
                },
                ...filtered
            ];

            // Giới hạn số lượng
            return newList.slice(0, MAX_RECENT_SEARCHES);
        });
    }, [isAuthenticated]);

    // Xóa một địa điểm khỏi lịch sử tìm kiếm
    const removeRecentSearch = useCallback((restaurantId) => {
        setRecentSearches(prev => prev.filter(item => item.id !== restaurantId));
    }, []);

    // Xóa toàn bộ lịch sử tìm kiếm
    const clearRecentSearches = useCallback(() => {
        setRecentSearches([]);
    }, []);

    const value = {
        // State
        favorites,
        favoriteIds,
        recentSearches,
        loading,

        // Actions
        addFavorite,
        removeFavorite,
        toggleFavorite,
        isFavorite,
        addRecentSearch,
        removeRecentSearch,
        clearRecentSearches,
        refreshFavorites
    };

    return (
        <CollectionContext.Provider value={value}>
            {children}
        </CollectionContext.Provider>
    );
};

export const useCollection = () => {
    const context = useContext(CollectionContext);
    if (!context) {
        throw new Error('useCollection must be used within a CollectionProvider');
    }
    return context;
};
