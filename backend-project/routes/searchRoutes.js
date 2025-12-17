// routes/searchRoutes.js
const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

// GET /api/search/autocomplete - Tìm kiếm gợi ý (dùng cho dropdown)
router.get('/autocomplete', searchController.searchAutocomplete);

// GET /api/search - Tìm kiếm đầy đủ (dùng cho trang kết quả)
router.get('/', searchController.searchRestaurants);

module.exports = router;

