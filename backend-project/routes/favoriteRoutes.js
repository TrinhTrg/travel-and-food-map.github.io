// routes/favoriteRoutes.js
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const favoriteController = require('../controllers/favoriteController');

// Tất cả routes đều yêu cầu đăng nhập
router.use(requireAuth);

// Lấy danh sách địa điểm yêu thích
router.get('/', favoriteController.getFavorites);

// Lấy danh sách ID của địa điểm yêu thích (dùng cho việc đồng bộ UI)
router.get('/ids', favoriteController.getFavoriteIds);

// Thêm địa điểm vào yêu thích
router.post('/', favoriteController.addFavorite);

// Kiểm tra địa điểm có trong yêu thích không
router.get('/check/:restaurantId', favoriteController.checkFavorite);

// Xóa địa điểm khỏi yêu thích
router.delete('/:restaurantId', favoriteController.removeFavorite);

module.exports = router;
