const { Restaurant, Category } = require('../models');
const { Op } = require('sequelize');

const getAllRestaurants = async (req, res) => {
  try {
    const { category_id, status, is_open } = req.query;

    const whereClause = {};

    // Filter by category
    if (category_id) {
      whereClause.category_id = category_id;
    }

    // Filter by status (default: only approved)
    whereClause.status = status || 'approved';

    // Filter by is_open if provided
    if (is_open !== undefined) {
      whereClause.is_open = is_open === 'true';
    }

    const restaurants = await Restaurant.findAll({
      where: whereClause,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        },
        {
          model: Category,
          as: 'categories',
          attributes: ['id', 'name'],
          through: { attributes: [] }
        }
      ],
      attributes: [
        'id',
        'name',
        'address',
        'description',
        'average_rating',
        'latitude',
        'longitude',
        'is_open',
        'review_count',
        'image_url',
        'status',
        'owner_id'
      ],
      order: [['average_rating', 'DESC'], ['review_count', 'DESC']]
    });

    // Format response để phù hợp với frontend
    const formattedRestaurants = restaurants.map(restaurant => {
      const restaurantData = restaurant.toJSON();
      const openStatus = restaurantData.is_open ? 'Đang mở cửa' : 'Đã đóng cửa';
      const moderationStatus = restaurantData.status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt';

      // Lấy categories từ many-to-many hoặc fallback về category cũ
      const categoriesList = restaurantData.categories && restaurantData.categories.length > 0
        ? restaurantData.categories
        : (restaurantData.category ? [restaurantData.category] : []);

      const categoryNames = categoriesList.map(cat => cat.name);

      return {
        id: restaurantData.id,
        name: restaurantData.name,
        image: restaurantData.image_url,
        bannerImage: restaurantData.image_url,
        rating: parseFloat(restaurantData.average_rating),
        reviews: restaurantData.review_count,
        address: restaurantData.address,
        openStatus,
        status: moderationStatus,
        isOpen: restaurantData.is_open,
        tags: categoryNames,
        category: categoryNames[0] || 'Khác',
        categories: categoryNames, // Thêm field mới
        description: restaurantData.description || 'Thông tin đang được cập nhật.',
        price: '$$', // Placeholder, có thể thêm field sau
        latitude: parseFloat(restaurantData.latitude),
        longitude: parseFloat(restaurantData.longitude),
        owner_id: restaurantData.owner_id,
        // Placeholder data cho popup detail
        reviewsList: [],
        userReview: null
      };
    });

    res.json({
      success: true,
      data: formattedRestaurants,
      count: formattedRestaurants.length
    });
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách nhà hàng',
      error: error.message
    });
  }
};

const getRestaurantById = async (req, res) => {
  try {
    const { id } = req.params;

    const restaurant = await Restaurant.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        },
        {
          model: Category,
          as: 'categories',
          attributes: ['id', 'name'],
          through: { attributes: [] }
        }
      ],
      attributes: [
        'id',
        'name',
        'address',
        'description',
        'average_rating',
        'latitude',
        'longitude',
        'is_open',
        'review_count',
        'image_url',
        'status',
        'owner_id'
      ]
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhà hàng'
      });
    }

    const restaurantData = restaurant.toJSON();

    // Format response để phù hợp với popup detail
    const openStatus = restaurantData.is_open ? 'Đang mở cửa' : 'Đã đóng cửa';
    const moderationStatus = restaurantData.status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt';

    // Lấy categories từ many-to-many hoặc fallback về category cũ
    const categoriesList = restaurantData.categories && restaurantData.categories.length > 0
      ? restaurantData.categories
      : (restaurantData.category ? [restaurantData.category] : []);

    const categoryNames = categoriesList.map(cat => cat.name);

    const formattedRestaurant = {
      id: restaurantData.id,
      name: restaurantData.name,
      image: restaurantData.image_url,
      bannerImage: restaurantData.image_url,
      rating: parseFloat(restaurantData.average_rating),
      reviews: restaurantData.review_count,
      address: restaurantData.address,
      openStatus,
      status: moderationStatus,
      isOpen: restaurantData.is_open,
      tags: categoryNames,
      category: categoryNames[0] || 'Khác',
      categories: categoryNames, // Thêm field mới
      description: restaurantData.description || 'Thông tin đang được cập nhật.',
      price: '$$',
      latitude: parseFloat(restaurantData.latitude),
      longitude: parseFloat(restaurantData.longitude),
      owner_id: restaurantData.owner_id,
      // Placeholder reviews - có thể thêm API riêng sau
      reviewsList: [
        {
          id: 'rv-1',
          name: 'Nguyễn Văn A',
          rating: Math.ceil(restaurantData.average_rating),
          comment: 'Nhà hàng rất tốt, phục vụ nhiệt tình!'
        },
        {
          id: 'rv-2',
          name: 'Trần Thị B',
          rating: Math.floor(restaurantData.average_rating),
          comment: 'Món ăn ngon, giá cả hợp lý.'
        }
      ],
      userReview: null
    };

    res.json({
      success: true,
      data: formattedRestaurant
    });
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin nhà hàng',
      error: error.message
    });
  }
};

const getRestaurantsByCategory = async (req, res) => {
  try {
    const { category_id } = req.params;

    const restaurants = await Restaurant.findAll({
      where: {
        status: 'approved'
      },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        },
        {
          model: Category,
          as: 'categories',
          attributes: ['id', 'name'],
          through: { attributes: [] },
          where: { id: category_id } // Filter by category trong many-to-many
        }
      ],
      attributes: [
        'id',
        'name',
        'address',
        'description',
        'average_rating',
        'latitude',
        'longitude',
        'is_open',
        'review_count',
        'image_url',
        'status'
      ],
      order: [['average_rating', 'DESC']]
    });

    const formattedRestaurants = restaurants.map(restaurant => {
      const restaurantData = restaurant.toJSON();
      const openStatus = restaurantData.is_open ? 'Đang mở cửa' : 'Đã đóng cửa';
      const moderationStatus = restaurantData.status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt';

      // Lấy categories từ many-to-many hoặc fallback về category cũ
      const categoriesList = restaurantData.categories && restaurantData.categories.length > 0
        ? restaurantData.categories
        : (restaurantData.category ? [restaurantData.category] : []);

      const categoryNames = categoriesList.map(cat => cat.name);

      return {
        id: restaurantData.id,
        name: restaurantData.name,
        image: restaurantData.image_url,
        bannerImage: restaurantData.image_url,
        rating: parseFloat(restaurantData.average_rating),
        reviews: restaurantData.review_count,
        address: restaurantData.address,
        openStatus,
        status: moderationStatus,
        isOpen: restaurantData.is_open,
        tags: categoryNames,
        category: categoryNames[0] || 'Khác',
        categories: categoryNames, // Thêm field mới
        description: restaurantData.description || 'Thông tin đang được cập nhật.',
        price: '$$',
        latitude: parseFloat(restaurantData.latitude),
        longitude: parseFloat(restaurantData.longitude),
        owner_id: restaurantData.owner_id,
        reviewsList: [],
        userReview: null
      };
    });

    res.json({
      success: true,
      data: formattedRestaurants,
      count: formattedRestaurants.length
    });
  } catch (error) {
    console.error('Error fetching restaurants by category:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách nhà hàng theo category',
      error: error.message
    });
  }
};

const createRestaurant = async (req, res) => {
  try {
    const {
      name,
      address,
      description,
      category_id,
      image_url,
      latitude,
      longitude,
    } = req.body;

    if (!name || !address || !category_id || latitude == null || longitude == null) {
      return res.status(400).json({
        success: false,
        message: 'name, address, category_id, latitude, longitude là bắt buộc',
      });
    }

    const category = await Category.findByPk(category_id);
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'category_id không hợp lệ',
      });
    }

    const ownerId = req.userId;

    if (!ownerId) {
      console.warn('Warning: Creating restaurant without owner_id');
    }

    const restaurant = await Restaurant.create({
      category_id,
      name,
      address,
      description: description || null,
      owner_id: ownerId ? parseInt(ownerId) : null,
      average_rating: 0,
      latitude,
      longitude,
      is_open: true,
      review_count: 0,
      image_url: image_url || null,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Tạo địa điểm thành công',
      data: {
        id: restaurant.id,
        name: restaurant.name,
        address: restaurant.address,
        description: restaurant.description,
        category_id: restaurant.category_id,
        image_url: restaurant.image_url,
        latitude: restaurant.latitude,
        longitude: restaurant.longitude,
        status: restaurant.status,
      },
    });
  } catch (error) {
    console.error('Error creating restaurant:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo nhà hàng',
      error: error.message,
    });
  }
};

const getOwnerRestaurants = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy thông tin user',
      });
    }

    const restaurants = await Restaurant.findAll({
      where: {
        owner_id: parseInt(userId)
      },
      attributes: ['id', 'name', 'address', 'status', 'image_url']
    });

    res.json({
      success: true,
      data: restaurants
    });
  } catch (error) {
    console.error('Error fetching owner restaurants:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách nhà hàng của owner',
      error: error.message
    });
  }
};

module.exports = {
  getAllRestaurants,
  getRestaurantById,
  getRestaurantsByCategory,
  createRestaurant,
  getOwnerRestaurants
};

