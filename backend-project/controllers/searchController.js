const { Restaurant, Category } = require('../models');
const { Op } = require('sequelize');

// Search autocomplete - trả về suggestions giống Shopee
const searchAutocomplete = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    // Nếu không có query, trả về empty
    if (!q || q.trim().length === 0) {
      return res.json({
        success: true,
        data: {
          restaurants: [],
          categories: [],
        },
      });
    }

    const searchTerm = q.trim();
    const searchLimit = Math.min(parseInt(limit) || 10, 20); // Tối đa 20 kết quả

    // Search restaurants - tìm theo name, address, description
    const restaurants = await Restaurant.findAll({
      where: {
        status: 'approved', // Chỉ lấy restaurants đã được approve
        [Op.or]: [
          { name: { [Op.like]: `%${searchTerm}%` } },
          { address: { [Op.like]: `%${searchTerm}%` } },
          { description: { [Op.like]: `%${searchTerm}%` } },
        ],
      },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name'],
        },
      ],
      attributes: [
        'id',
        'name',
        'address',
        'average_rating',
        'review_count',
        'image_url',
        'latitude',
        'longitude',
      ],
      limit: searchLimit,
      order: [
        ['average_rating', 'DESC'],
        ['review_count', 'DESC'],
      ],
    });

    // Search categories - tìm categories có chứa keyword
    const categories = await Category.findAll({
      where: {
        name: { [Op.like]: `%${searchTerm}%` },
      },
      attributes: ['id', 'name'],
      limit: 5, // Giới hạn 5 categories
    });

    // Format response
    const formattedRestaurants = restaurants.map((restaurant) => {
      const restaurantData = restaurant.toJSON();
      return {
        id: restaurantData.id,
        name: restaurantData.name,
        address: restaurantData.address,
        rating: parseFloat(restaurantData.average_rating) || 0,
        reviews: restaurantData.review_count || 0,
        image: restaurantData.image_url,
        category: restaurantData.category?.name || '',
        latitude: parseFloat(restaurantData.latitude),
        longitude: parseFloat(restaurantData.longitude),
      };
    });

    const formattedCategories = categories.map((category) => ({
      id: category.id,
      name: category.name,
    }));

    res.json({
      success: true,
      data: {
        restaurants: formattedRestaurants,
        categories: formattedCategories,
      },
    });
  } catch (error) {
    console.error('Error in search autocomplete:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tìm kiếm',
      error: error.message,
    });
  }
};

// Full search - tìm kiếm đầy đủ (dùng cho trang kết quả)
const searchRestaurants = async (req, res) => {
  try {
    const { q, category_id, limit = 50, offset = 0 } = req.query;

    const whereClause = {
      status: 'approved',
    };

    // Tìm kiếm theo từ khóa
    if (q && q.trim().length > 0) {
      const searchTerm = q.trim();
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${searchTerm}%` } },
        { address: { [Op.like]: `%${searchTerm}%` } },
        { description: { [Op.like]: `%${searchTerm}%` } },
      ];
    }

    // Filter by category
    if (category_id) {
      whereClause.category_id = category_id;
    }

    const restaurants = await Restaurant.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name'],
        },
      ],
      attributes: [
        'id',
        'name',
        'address',
        'description',
        'average_rating',
        'review_count',
        'image_url',
        'latitude',
        'longitude',
        'is_open',
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [
        ['average_rating', 'DESC'],
        ['review_count', 'DESC'],
      ],
    });

    // Format response giống getAllRestaurants
    const formattedRestaurants = restaurants.rows.map((restaurant) => {
      const restaurantData = restaurant.toJSON();
      return {
        id: restaurantData.id,
        name: restaurantData.name,
        image: restaurantData.image_url,
        bannerImage: restaurantData.image_url,
        rating: parseFloat(restaurantData.average_rating),
        reviews: restaurantData.review_count,
        address: restaurantData.address,
        status: restaurantData.is_open ? 'Đang mở cửa' : 'Đã đóng cửa',
        isOpen: restaurantData.is_open,
        tags: restaurantData.category ? [restaurantData.category.name] : [],
        category: restaurantData.category ? restaurantData.category.name : 'Khác',
        description: restaurantData.description || 'Thông tin đang được cập nhật.',
        price: '$$',
        latitude: parseFloat(restaurantData.latitude),
        longitude: parseFloat(restaurantData.longitude),
      };
    });

    res.json({
      success: true,
      data: formattedRestaurants,
      count: restaurants.count,
      total: restaurants.count,
    });
  } catch (error) {
    console.error('Error in search restaurants:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tìm kiếm nhà hàng',
      error: error.message,
    });
  }
};

module.exports = {
  searchAutocomplete,
  searchRestaurants,
};

