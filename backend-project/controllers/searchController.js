const { Restaurant, Category } = require('../models');
const { Op } = require('sequelize');

const searchAutocomplete = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    // Nếu không có query trả về empty
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

    // Tìm theo name, address, description
    const restaurants = await Restaurant.findAll({
      where: {
        status: 'approved',
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
        'owner_id',
      ],
      limit: searchLimit,
      order: [
        ['average_rating', 'DESC'],
        ['review_count', 'DESC'],
      ],
    });

    // Tìm categories có chứa keyword
    const categories = await Category.findAll({
      where: {
        name: { [Op.like]: `%${searchTerm}%` },
      },
      attributes: ['id', 'name'],
      limit: 5,
    });

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
        owner_id: restaurantData.owner_id,
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

const searchRestaurants = async (req, res) => {
  try {
    const { q, category_id, category_name, limit = 50, offset = 0 } = req.query;

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

    // Tìm kiếm theo category name
    let categoryIdToFilter = category_id;
    if (category_name && !category_id) {
      // Tìm category theo tên
      const categoryNameTrimmed = category_name.trim();
      let category = await Category.findOne({
        where: {
          name: { [Op.like]: categoryNameTrimmed }
        }
      });
      
      // Nếu không tìm thấy exact match, thử partial match
      if (!category) {
        category = await Category.findOne({
          where: {
            name: { [Op.like]: `%${categoryNameTrimmed}%` }
          }
        });
      }
      
      if (category) {
        categoryIdToFilter = category.id;
      }
      // Nếu không tìm thấy category, vẫn tiếp tục search theo tên/address/description
    }

    // Build include options for category filtering
    const includeOptions = [
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name'],
        required: false
      },
      {
        model: Category,
        as: 'categories',
        attributes: ['id', 'name'],
        through: { attributes: [] },
        required: false
      }
    ];

    // Filter by category using many-to-many relationship
    if (categoryIdToFilter) {
      includeOptions[1].where = { id: categoryIdToFilter };
      includeOptions[1].required = true; // INNER JOIN to filter
    }

    const restaurants = await Restaurant.findAndCountAll({
      where: whereClause,
      include: includeOptions,
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
        'owner_id',
        'opening_hours',
        'phone_number',
        'website',
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
        status: restaurantData.is_open ? 'Đang mở cửa' : 'Đã đóng cửa',
        statusRaw: restaurantData.status, // Giữ giá trị gốc 'approved'/'pending' để frontend check
        isOpen: restaurantData.is_open,
        tags: categoryNames,
        category: categoryNames[0] || 'Khác',
        categories: categoryNames, // Thêm field mới
        description: restaurantData.description || 'Thông tin đang được cập nhật.',
        price: '$$',
        latitude: parseFloat(restaurantData.latitude),
        longitude: parseFloat(restaurantData.longitude),
        owner_id: restaurantData.owner_id,
        opening_hours: restaurantData.opening_hours,
        phone_number: restaurantData.phone_number,
        website: restaurantData.website,
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

