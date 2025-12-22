const { FavoritePlace, Restaurant, Category } = require('../models');

// Lấy danh sách địa điểm yêu thích của user
const getFavorites = async (req, res, next) => {
    try {
        const userId = req.userId;

        const favorites = await FavoritePlace.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: Restaurant,
                    as: 'restaurant',
                    attributes: [
                        'id', 'name', 'address', 'description',
                        'average_rating', 'latitude', 'longitude',
                        'is_open', 'review_count', 'image_url'
                    ],
                    include: [
                        {
                            model: Category,
                            as: 'category',
                            attributes: ['id', 'name']
                        }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        // Format response data
        const formattedFavorites = favorites.map(fav => {
            const restaurant = fav.restaurant;
            if (!restaurant) return null;

            return {
                id: restaurant.id,
                name: restaurant.name,
                address: restaurant.address,
                description: restaurant.description,
                rating: restaurant.average_rating,
                latitude: parseFloat(restaurant.latitude),
                longitude: parseFloat(restaurant.longitude),
                isOpen: restaurant.is_open,
                reviews: restaurant.review_count,
                image: restaurant.image_url,
                category: restaurant.category?.name || 'Khác',
                favoriteId: fav.id,
                addedAt: fav.createdAt
            };
        }).filter(Boolean);

        res.json({
            success: true,
            data: formattedFavorites
        });
    } catch (error) {
        next(error);
    }
};

// Thêm địa điểm vào danh sách yêu thích
const addFavorite = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { restaurantId } = req.body;

        if (!restaurantId) {
            return res.status(400).json({
                success: false,
                message: 'restaurantId là bắt buộc'
            });
        }

        // Kiểm tra restaurant tồn tại
        const restaurant = await Restaurant.findByPk(restaurantId);
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy địa điểm'
            });
        }

        // Kiểm tra đã yêu thích chưa
        const existingFavorite = await FavoritePlace.findOne({
            where: {
                user_id: userId,
                restaurant_id: restaurantId
            }
        });

        if (existingFavorite) {
            return res.status(400).json({
                success: false,
                message: 'Địa điểm đã được thêm vào yêu thích'
            });
        }

        // Thêm mới
        const favorite = await FavoritePlace.create({
            user_id: userId,
            restaurant_id: restaurantId
        });

        res.status(201).json({
            success: true,
            message: 'Đã thêm vào danh sách yêu thích',
            data: {
                id: favorite.id,
                restaurantId: restaurantId,
                addedAt: favorite.createdAt
            }
        });
    } catch (error) {
        next(error);
    }
};

// Xóa địa điểm khỏi danh sách yêu thích
const removeFavorite = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { restaurantId } = req.params;

        if (!restaurantId) {
            return res.status(400).json({
                success: false,
                message: 'restaurantId là bắt buộc'
            });
        }

        const favorite = await FavoritePlace.findOne({
            where: {
                user_id: userId,
                restaurant_id: restaurantId
            }
        });

        if (!favorite) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy trong danh sách yêu thích'
            });
        }

        await favorite.destroy();

        res.json({
            success: true,
            message: 'Đã xóa khỏi danh sách yêu thích'
        });
    } catch (error) {
        next(error);
    }
};

// Kiểm tra địa điểm có trong danh sách yêu thích không
const checkFavorite = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { restaurantId } = req.params;

        const favorite = await FavoritePlace.findOne({
            where: {
                user_id: userId,
                restaurant_id: restaurantId
            }
        });

        res.json({
            success: true,
            data: {
                isFavorite: !!favorite
            }
        });
    } catch (error) {
        next(error);
    }
};

// Lấy danh sách ID của tất cả địa điểm yêu thích
const getFavoriteIds = async (req, res, next) => {
    try {
        const userId = req.userId;

        const favorites = await FavoritePlace.findAll({
            where: { user_id: userId },
            attributes: ['restaurant_id']
        });

        const ids = favorites.map(fav => fav.restaurant_id);

        res.json({
            success: true,
            data: ids
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getFavorites,
    addFavorite,
    removeFavorite,
    checkFavorite,
    getFavoriteIds
};
