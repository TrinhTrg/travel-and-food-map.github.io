const db = require('../models');
const { Restaurant, User, Category } = db;
const { sendOwnerPromotionEmail, sendRoleDemotionEmail } = require('../services/emailService');

// Lấy thống kê tổng quan
const getStats = async (req, res) => {
  try {
    const totalRestaurants = await Restaurant.count();
    const approvedRestaurants = await Restaurant.count({ where: { status: 'approved' } });
    const pendingRestaurants = await Restaurant.count({ where: { status: 'pending' } });
    const totalUsers = await User.count();
    const totalOwners = await User.count({ where: { role: 'owner' } });
    const totalAdmins = await User.count({ where: { role: 'admin' } });

    res.json({
      success: true,
      data: {
        restaurants: {
          total: totalRestaurants,
          approved: approvedRestaurants,
          pending: pendingRestaurants
        },
        users: {
          total: totalUsers,
          owners: totalOwners,
          admins: totalAdmins
        }
      }
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê'
    });
  }
};

// Lấy danh sách nhà hàng chờ duyệt
const getPendingRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.findAll({
      where: { status: 'pending' },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: restaurants
    });
  } catch (error) {
    console.error('Error getting pending restaurants:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách nhà hàng chờ duyệt'
    });
  }
};

// Duyệt nhà hàng
const approveRestaurant = async (req, res) => {
  try {
    const { id } = req.params;

    const restaurant = await Restaurant.findByPk(id);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhà hàng'
      });
    }

    if (restaurant.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Nhà hàng đã được duyệt rồi'
      });
    }

    await restaurant.update({ status: 'approved' });

    res.json({
      success: true,
      message: 'Duyệt nhà hàng thành công',
      data: restaurant
    });
  } catch (error) {
    console.error('Error approving restaurant:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi duyệt nhà hàng'
    });
  }
};

// Từ chối nhà hàng (xóa khỏi hệ thống)
const rejectRestaurant = async (req, res) => {
  try {
    const { id } = req.params;

    const restaurant = await Restaurant.findByPk(id);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhà hàng'
      });
    }

    await restaurant.destroy();

    res.json({
      success: true,
      message: 'Đã từ chối nhà hàng'
    });
  } catch (error) {
    console.error('Error rejecting restaurant:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi từ chối nhà hàng'
    });
  }
};

// Lấy danh sách users để quản lý
const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    // Đếm số nhà hàng của mỗi owner
    const usersWithRestaurantCount = await Promise.all(
      users.map(async (user) => {
        const restaurantCount = await Restaurant.count({
          where: { owner_id: user.id }
        });
        return {
          ...user.toJSON(),
          restaurantCount
        };
      })
    );

    res.json({
      success: true,
      data: usersWithRestaurantCount
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách người dùng'
    });
  }
};

// Cập nhật role của user
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const ALLOWED_ROLES = ['user', 'owner', 'admin'];
    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role không hợp lệ'
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Không cho phép admin tự đổi role của chính mình
    if (user.id === req.userId && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Bạn không thể tự đổi role của chính mình'
      });
    }

    // Lưu lại old role để gửi email phù hợp
    const oldRole = user.role;

    await user.update({ role });

    // Gửi email thông báo
    let emailResult = { success: false };
    if (role === 'owner' && oldRole !== 'owner') {
      // Phong làm Owner
      console.log(`📧 Sending owner promotion email to ${user.email}`);
      emailResult = await sendOwnerPromotionEmail(user.email, user.name);
    } else if (oldRole === 'owner' && role !== 'owner') {
      // Hạ cấp từ Owner xuống role khác
      console.log(`📧 Sending role change email to ${user.email}`);
      emailResult = await sendRoleDemotionEmail(user.email, user.name, role);
    }

    res.json({
      success: true,
      message: `Cập nhật role thành công${emailResult.success ? ' và đã gửi email thông báo' : ''}`,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      emailSent: emailResult.success
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật role'
    });
  }
};

module.exports = {
  getStats,
  getPendingRestaurants,
  approveRestaurant,
  rejectRestaurant,
  getUsers,
  updateUserRole
};

