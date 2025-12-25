const { Review, ImageReview, Restaurant, User, Category } = require('../models');
const path = require('path');
const fs = require('fs');

// Helper function để format thời gian relative
const formatRelativeTime = (date) => {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffSeconds < 60) return 'vừa xong';
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffWeeks < 4) return `${diffWeeks} tuần trước`;
    if (diffMonths < 12) return `${diffMonths} tháng trước`;
    return new Date(date).toLocaleDateString('vi-VN');
};

// Lấy tất cả reviews của một restaurant
const getReviewsByRestaurant = async (req, res, next) => {
    try {
        const { restaurantId } = req.params;

        const reviews = await Review.findAll({
            where: { restaurant_id: restaurantId },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: ImageReview,
                    as: 'images',
                    attributes: ['id', 'image_url']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        // Format response
        const formattedReviews = reviews.map(review => ({
            id: review.id,
            userId: review.user_id,
            userName: review.user?.name || 'Ẩn danh',
            userAvatar: null, // Có thể thêm avatar sau
            rating: review.rating,
            content: review.content,
            images: (review.images || []).map(img => ({
                id: img.id,
                url: img.image_url
            })),
            createdAt: review.createdAt,
            relativeTime: formatRelativeTime(review.createdAt)
        }));

        res.json({
            success: true,
            data: formattedReviews,
            total: formattedReviews.length
        });
    } catch (error) {
        next(error);
    }
};

// Tạo hoặc cập nhật review
const createOrUpdateReview = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { restaurantId, rating, content, imageUrls } = req.body;

        // Validate input
        if (!restaurantId) {
            return res.status(400).json({
                success: false,
                message: 'restaurantId là bắt buộc'
            });
        }

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating phải từ 1 đến 5'
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

        // Luôn tạo review mới (không update review cũ)
        const review = await Review.create({
                user_id: userId,
            restaurant_id: restaurantId,
                rating,
                content: content || ''
        });

        // Xử lý ảnh - thêm ảnh mới cho review mới
        if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
                const imageRecords = imageUrls.map(url => ({
                    review_id: review.id,
                    image_url: url
                }));
                await ImageReview.bulkCreate(imageRecords);
        }

        // Cập nhật rating trung bình của restaurant
        await updateRestaurantRating(restaurantId);

        // Lấy lại review với images
        const updatedReview = await Review.findByPk(review.id, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name']
                },
                {
                    model: ImageReview,
                    as: 'images',
                    attributes: ['id', 'image_url']
                }
            ]
        });

        res.status(201).json({
            success: true,
            message: 'Đánh giá đã được tạo',
            data: {
                id: updatedReview.id,
                userId: updatedReview.user_id,
                userName: updatedReview.user?.name || 'Ẩn danh',
                rating: updatedReview.rating,
                content: updatedReview.content,
                images: (updatedReview.images || []).map(img => ({
                    id: img.id,
                    url: img.image_url
                })),
                createdAt: updatedReview.createdAt,
                relativeTime: formatRelativeTime(updatedReview.createdAt)
            }
        });
    } catch (error) {
        next(error);
    }
};

// Upload ảnh review
const uploadReviewImages = async (req, res, next) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Không có file ảnh được upload'
            });
        }

        // Trả về URLs của các ảnh đã upload
        const uploadedUrls = req.files.map(file => {
            // Tạo URL public cho ảnh
            return `/uploads/reviews/${file.filename}`;
        });

        res.json({
            success: true,
            message: 'Upload ảnh thành công',
            data: uploadedUrls
        });
    } catch (error) {
        next(error);
    }
};

// Xóa review
const deleteReview = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { reviewId } = req.params;

        const review = await Review.findOne({
            where: {
                id: reviewId,
                user_id: userId
            }
        });

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đánh giá hoặc bạn không có quyền xóa'
            });
        }

        const restaurantId = review.restaurant_id;

        // Xóa ảnh liên quan trước
        await ImageReview.destroy({
            where: { review_id: review.id }
        });

        // Xóa review
        await review.destroy();

        // Cập nhật rating restaurant
        await updateRestaurantRating(restaurantId);

        res.json({
            success: true,
            message: 'Đã xóa đánh giá'
        });
    } catch (error) {
        next(error);
    }
};

// Lấy review của user cho một restaurant cụ thể
const getUserReview = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { restaurantId } = req.params;

        const review = await Review.findOne({
            where: {
                user_id: userId,
                restaurant_id: restaurantId
            },
            include: [
                {
                    model: ImageReview,
                    as: 'images',
                    attributes: ['id', 'image_url']
                }
            ]
        });

        if (!review) {
            return res.json({
                success: true,
                data: null
            });
        }

        res.json({
            success: true,
            data: {
                id: review.id,
                rating: review.rating,
                content: review.content,
                images: (review.images || []).map(img => ({
                    id: img.id,
                    url: img.image_url
                })),
                createdAt: review.createdAt
            }
        });
    } catch (error) {
        next(error);
    }
};

// Lấy số lượng reviews của user hiện tại
const getUserReviewCount = async (req, res, next) => {
    try {
        const userId = req.userId;

        const count = await Review.count({
            where: { user_id: userId }
        });

        res.json({
            success: true,
            data: {
                count: count
            }
        });
    } catch (error) {
        next(error);
    }
};

// Lấy tất cả reviews của user hiện tại (với thông tin restaurant)
const getUserReviews = async (req, res, next) => {
    try {
        const userId = req.userId;

        const reviews = await Review.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: Restaurant,
                    as: 'restaurant',
                    attributes: ['id', 'name', 'address', 'image_url', 'average_rating', 'review_count'],
                    include: [
                        {
                            model: Category,
                            as: 'category',
                            attributes: ['id', 'name'],
                            required: false
                        }
                    ]
                },
                {
                    model: ImageReview,
                    as: 'images',
                    attributes: ['id', 'image_url']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        const formattedReviews = reviews
            .filter(review => review.restaurant !== null) // Filter out reviews with deleted restaurants
            .map(review => ({
                id: review.id,
                restaurant: {
                    id: review.restaurant.id,
                    name: review.restaurant.name,
                    address: review.restaurant.address,
                    image_url: review.restaurant.image_url,
                    average_rating: review.restaurant.average_rating,
                    review_count: review.restaurant.review_count,
                    category: review.restaurant.category
                },
                rating: review.rating,
                content: review.content,
                images: (review.images || []).map(img => ({
                    id: img.id,
                    url: img.image_url
                })),
                createdAt: review.createdAt,
                relativeTime: formatRelativeTime(review.createdAt)
            }));

        res.json({
            success: true,
            data: formattedReviews,
            total: formattedReviews.length
        });
    } catch (error) {
        next(error);
    }
};

// Helper function để cập nhật rating trung bình của restaurant
const updateRestaurantRating = async (restaurantId) => {
    try {
        const result = await Review.findAll({
            where: { restaurant_id: restaurantId },
            attributes: [
                [require('sequelize').fn('AVG', require('sequelize').col('rating')), 'avgRating'],
                [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
            ],
            raw: true
        });

        const avgRating = result[0]?.avgRating || 0;
        const reviewCount = result[0]?.count || 0;

        await Restaurant.update(
            {
                average_rating: parseFloat(avgRating).toFixed(1),
                review_count: reviewCount
            },
            {
                where: { id: restaurantId }
            }
        );
    } catch (error) {
        console.error('Error updating restaurant rating:', error);
    }
};

module.exports = {
    getReviewsByRestaurant,
    createOrUpdateReview,
    uploadReviewImages,
    deleteReview,
    getUserReview,
    getUserReviewCount,
    getUserReviews
};
