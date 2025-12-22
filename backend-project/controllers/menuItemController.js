const { MenuItem, Restaurant, User } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

// Helper constants
const STATUS_LABELS = {
    'pending_approval': 'Chờ duyệt',
    'approved': 'Đã duyệt',
    'rejected': 'Từ chối'
};

const CATEGORY_LABELS = {
    'appetizer': 'Khai vị',
    'main_course': 'Món chính',
    'dessert': 'Tráng miệng',
    'drink': 'Đồ uống',
    'other': 'Khác'
};

const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

// ============ USER ENDPOINTS ============

// Lấy menu items đã approve của một restaurant (public) - Owner/Admin thấy all
const getMenuByRestaurant = async (req, res, next) => {
    try {
        const { restaurantId } = req.params;
        const { category, popular } = req.query;

        // 1. Check Auth manually
        let userId = null;
        let userRole = null;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
                userId = decoded.id;
                userRole = decoded.role;
            } catch (err) {
                // Token invalid/expired -> treat as guest
            }
        }

        // 2. Check Restaurant Owner
        const restaurant = await Restaurant.findByPk(restaurantId);
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhà hàng'
            });
        }

        // 3. Xây dựng filter
        const isOwner = userId && (parseInt(userId) === restaurant.owner_id);
        const isAdmin = userRole === 'admin';
        const canViewAll = isOwner || isAdmin;

        const whereClause = {
            restaurant_id: restaurantId,
            ...(canViewAll ? {} : { status: 'approved' })
        };

        if (category) {
            whereClause.category = category;
        }

        if (popular === 'true') {
            whereClause.is_popular = true;
        }

        const menuItems = await MenuItem.findAll({
            where: whereClause,
            order: [
                ['is_popular', 'DESC'],
                ['category', 'ASC'],
                ['name', 'ASC']
            ]
        });

        const formattedItems = menuItems.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            priceFormatted: formatPrice(item.price),
            imageUrl: item.image_url,
            category: item.category,
            categoryLabel: CATEGORY_LABELS[item.category],
            isPopular: item.is_popular,
            status: item.status,
            statusLabel: STATUS_LABELS[item.status],
            rejectionReason: item.rejection_reason
        }));

        res.json({
            success: true,
            data: formattedItems,
            total: formattedItems.length,
            isOwner: isOwner
        });
    } catch (error) {
        next(error);
    }
};

// ============ OWNER ENDPOINTS ============

// Lấy tất cả menu items của owner (để quản lý)
const getOwnerMenuItems = async (req, res, next) => {
    try {
        const userId = req.userId;

        // Tìm restaurants của owner
        const restaurants = await Restaurant.findAll({
            where: { owner_id: userId },
            attributes: ['id', 'name']
        });

        const restaurantIds = restaurants.map(r => r.id);

        if (restaurantIds.length === 0) {
            return res.json({
                success: true,
                data: [],
                total: 0
            });
        }

        const menuItems = await MenuItem.findAll({
            where: {
                restaurant_id: {
                    [Op.in]: restaurantIds
                }
            },
            include: [{
                model: Restaurant,
                as: 'restaurant',
                attributes: ['id', 'name']
            }],
            order: [['created_at', 'DESC']]
        });

        const formattedItems = menuItems.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            priceFormatted: formatPrice(item.price),
            imageUrl: item.image_url,
            category: item.category,
            categoryLabel: CATEGORY_LABELS[item.category],
            isPopular: item.is_popular,
            status: item.status,
            statusLabel: STATUS_LABELS[item.status],
            rejectionReason: item.rejection_reason,
            restaurantName: item.restaurant.name
        }));

        res.json({
            success: true,
            data: formattedItems,
            total: formattedItems.length
        });

    } catch (error) {
        next(error);
    }
};

const createMenuItem = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { restaurantId, name, price, category, isPopular } = req.body;
        const imageFile = req.file;

        // Kiểm tra restaurant tồn tại
        const restaurant = await Restaurant.findByPk(restaurantId);

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhà hàng'
            });
        }

        // Kiểm tra quyền: Owner hoặc Admin
        if (restaurant.owner_id != userId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền thêm món cho nhà hàng này'
            });
        }

        // Tạo item
        let imageUrl = null;
        if (imageFile) {
            imageUrl = `/uploads/menu/${imageFile.filename}`;
        }

        const newItem = await MenuItem.create({
            restaurant_id: restaurantId,
            name,
            price,
            category: category || 'other',
            is_popular: isPopular === 'true',
            image_url: imageUrl,
            status: 'pending_approval' // Luôn cần duyệt
        });

        res.status(201).json({
            success: true,
            message: 'Tạo món ăn thành công, vui lòng chờ duyệt',
            data: newItem
        });

    } catch (error) {
        // Xóa ảnh nếu lỗi
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        next(error);
    }
};

const updateMenuItem = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const { name, price, category, isPopular } = req.body;
        const imageFile = req.file;

        const menuItem = await MenuItem.findByPk(id, {
            include: [{
                model: Restaurant,
                as: 'restaurant',
                attributes: ['id', 'owner_id']
            }]
        });

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy món ăn'
            });
        }

        // Kiểm tra quyền sở hữu hoặc Admin
        if (menuItem.restaurant.owner_id != userId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền sửa món này'
            });
        }

        // Nếu món đang pending, owner được sửa thoải mái.
        // Nếu món đang approved/rejected, sửa sẽ set về pending_approval

        const updateData = {};
        if (name) updateData.name = name;
        if (price) updateData.price = price;
        if (category) updateData.category = category;
        if (typeof isPopular !== 'undefined') updateData.is_popular = isPopular === 'true';

        if (imageFile) {
            // Delete old image if exists
            if (menuItem.image_url) {
                const oldPath = path.join(__dirname, '../public', menuItem.image_url);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }
            updateData.image_url = `/uploads/menu/${imageFile.filename}`;
        }

        // Reset status to pending_approval on update
        updateData.status = 'pending_approval';
        updateData.rejection_reason = null;

        await menuItem.update(updateData);

        res.json({
            success: true,
            message: 'Cập nhật món ăn thành công (chờ duyệt lại)',
            data: menuItem
        });

    } catch (error) {
        if (req.file) fs.unlinkSync(req.file.path);
        next(error);
    }
};

const deleteMenuItem = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const menuItem = await MenuItem.findByPk(id, {
            include: [{
                model: Restaurant,
                as: 'restaurant',
                attributes: ['id', 'owner_id']
            }]
        });

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy món ăn'
            });
        }

        // Kiểm tra quyền sở hữu hoặc Admin
        if (menuItem.restaurant.owner_id != userId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xóa món này'
            });
        }

        // Delete image
        if (menuItem.image_url) {
            const oldPath = path.join(__dirname, '../public', menuItem.image_url);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        await menuItem.destroy();

        res.json({
            success: true,
            message: 'Đã xóa món ăn'
        });
    } catch (error) {
        next(error);
    }
};

const uploadMenuImage = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Vui lòng chọn ảnh' });
        }
        const imageUrl = `/uploads/menu/${req.file.filename}`;
        res.json({ success: true, url: imageUrl });
    } catch (error) {
        next(error);
    }
};

// ============ ADMIN ENDPOINTS ============

// Lấy danh sách menu items chờ duyệt
const getPendingMenuItems = async (req, res, next) => {
    try {
        const menuItems = await MenuItem.findAll({
            where: {
                status: 'pending_approval'
            },
            include: [{
                model: Restaurant,
                as: 'restaurant',
                attributes: ['id', 'name'],
                include: [{
                    model: User,
                    as: 'owner',
                    attributes: ['id', 'name', 'email']
                }]
            }],
            order: [['createdAt', 'ASC']] // Corrected based on previous fix
        });

        const formattedItems = menuItems.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            priceFormatted: formatPrice(item.price),
            imageUrl: item.image_url,
            category: item.category,
            categoryLabel: CATEGORY_LABELS[item.category],
            isPopular: item.is_popular,
            status: item.status,
            restaurantId: item.restaurant_id,
            restaurantName: item.restaurant?.name,
            ownerName: item.restaurant?.owner?.name,
            ownerEmail: item.restaurant?.owner?.email,
            createdAt: item.createdAt // Corrected based on previous fix
        }));

        res.json({
            success: true,
            data: formattedItems,
            total: formattedItems.length
        });
    } catch (error) {
        next(error);
    }
};

// Phê duyệt menu item (Admin)
const approveMenuItem = async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log(`Approving menu item: ${id}`);

        const menuItem = await MenuItem.findByPk(id);

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy món ăn'
            });
        }

        if (menuItem.status !== 'pending_approval') {
            // Logic warning if needed
        }

        await menuItem.update({
            status: 'approved',
            rejection_reason: null
        });

        console.log(`Approved menu item ${id} successfully`);

        res.json({
            success: true,
            message: 'Đã phê duyệt món ăn'
        });
    } catch (error) {
        console.error('Error approving menu item:', error);
        next(error);
    }
};

// Từ chối menu item (Admin)
const rejectMenuItem = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const menuItem = await MenuItem.findByPk(id);

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy món ăn'
            });
        }

        if (menuItem.status !== 'pending_approval') {
            return res.status(400).json({
                success: false,
                message: 'Món ăn này không trong trạng thái chờ duyệt'
            });
        }

        await menuItem.update({
            status: 'rejected',
            rejection_reason: reason || null
        });

        res.json({
            success: true,
            message: 'Đã từ chối món ăn'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getMenuByRestaurant,
    getOwnerMenuItems,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    uploadMenuImage,
    getPendingMenuItems,
    approveMenuItem,
    rejectMenuItem
};
