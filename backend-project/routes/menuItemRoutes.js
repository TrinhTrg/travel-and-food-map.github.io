const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { requireAuth, requireAdmin, requireOwner } = require('../middleware/auth');
const menuItemController = require('../controllers/menuItemController');

// Cấu hình multer cho upload ảnh menu
const uploadDir = path.join(__dirname, '../public/uploads/menu');

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
        cb(null, `menu-${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file ảnh (jpeg, jpg, png, webp)'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

// ============ PUBLIC ROUTES ============

// Lấy menu của một restaurant (chỉ items đã approved)
router.get('/restaurant/:restaurantId', menuItemController.getMenuByRestaurant);

// ============ OWNER ROUTES ============

// Lấy tất cả menu items của owner
router.get('/owner', requireAuth, requireOwner, menuItemController.getOwnerMenuItems);

// Tạo menu item mới
router.post('/', requireAuth, requireOwner, upload.single('image'), menuItemController.createMenuItem);

// Cập nhật menu item
router.put('/:id', requireAuth, requireOwner, upload.single('image'), menuItemController.updateMenuItem);

// Xóa menu item
router.delete('/:id', requireAuth, requireOwner, menuItemController.deleteMenuItem);

// Upload ảnh riêng
router.post('/upload', requireAuth, requireOwner, upload.single('image'), menuItemController.uploadMenuImage);

// ============ ADMIN ROUTES ============

// Lấy danh sách chờ duyệt
router.get('/pending', requireAuth, requireAdmin, menuItemController.getPendingMenuItems);

// Phê duyệt món ăn
router.patch('/:id/approve', requireAuth, requireAdmin, menuItemController.approveMenuItem);

// Từ chối món ăn
router.patch('/:id/reject', requireAuth, requireAdmin, menuItemController.rejectMenuItem);

module.exports = router;
