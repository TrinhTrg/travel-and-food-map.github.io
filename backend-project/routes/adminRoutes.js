const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Tất cả routes đều yêu cầu authentication và admin role
router.use(requireAuth);
router.use(requireAdmin);

// Stats
router.get('/stats', adminController.getStats);

// Pending restaurants
router.get('/restaurants/pending', adminController.getPendingRestaurants);
router.put('/restaurants/:id/approve', adminController.approveRestaurant);
router.delete('/restaurants/:id/reject', adminController.rejectRestaurant);

// User management
router.get('/users', adminController.getUsers);
router.put('/users/:id/role', adminController.updateUserRole);

module.exports = router;

