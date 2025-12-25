const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController');
const { requireAuth } = require('../middleware/auth');

// GET /api/restaurants
router.get('/', restaurantController.getAllRestaurants);

// GET /api/restaurants/owner - Đặt trước /:id
router.get('/owner', requireAuth, restaurantController.getOwnerRestaurants);

// GET /api/restaurants/:id
router.get('/:id', restaurantController.getRestaurantById);

// GET /api/restaurants/by-category/:category_id
router.get('/by-category/:category_id', restaurantController.getRestaurantsByCategory);

// POST /api/restaurants
router.post('/', requireAuth, restaurantController.createRestaurant);

// POST /api/restaurants/:id/view - Track restaurant view (không cần auth, có thể dùng session_id)
router.post('/:id/view', restaurantController.trackRestaurantView);

module.exports = router;

