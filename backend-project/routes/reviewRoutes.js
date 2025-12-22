// routes/reviewRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { requireAuth } = require('../middleware/auth');
const reviewController = require('../controllers/reviewController');

// Cấu hình multer cho upload ảnh
const uploadDir = path.join(__dirname, '../public/uploads/reviews');

// Tạo thư mục nếu chưa tồn tại
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `review-${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    // Chỉ cho phép upload ảnh
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file ảnh (jpeg, jpg, png, gif, webp)'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 5 // Tối đa 5 ảnh
    }
});

// === PUBLIC ROUTES ===

// Lấy tất cả reviews của một restaurant
router.get('/restaurant/:restaurantId', reviewController.getReviewsByRestaurant);

// === PROTECTED ROUTES (yêu cầu đăng nhập) ===

// Lấy review của user cho restaurant cụ thể
router.get('/user/:restaurantId', requireAuth, reviewController.getUserReview);

// Tạo hoặc cập nhật review
router.post('/', requireAuth, reviewController.createOrUpdateReview);

// Upload ảnh review
router.post('/upload', requireAuth, upload.array('images', 5), reviewController.uploadReviewImages);

// Xóa review
router.delete('/:reviewId', requireAuth, reviewController.deleteReview);

module.exports = router;
