const { Restaurant, Category, RestaurantView } = require('../models');
const { Op } = require('sequelize');

const getAllRestaurants = async (req, res) => {
  try {
    const { category_id, status, is_open, viewed_only, session_id } = req.query;
    const userId = req.userId || null;

    const whereClause = {};

    // Filter by status
    whereClause.status = status || 'approved';

    // Filter by is_open 
    if (is_open !== undefined) {
      whereClause.is_open = is_open === 'true';
    }

    // Nếu chỉ lấy restaurants đã xem
    let viewedRestaurantIds = null;
    if (viewed_only === 'true') {
      const viewWhere = {};
      if (userId) {
        viewWhere.user_id = userId;
      } else if (session_id) {
        viewWhere.session_id = session_id;
      } else {
        // Không có user_id hoặc session_id trả về empty
        return res.json({
          success: true,
          data: [],
          count: 0
        });
      }

      // Lấy 2-3 restaurants đã xem gần nhất
      const views = await RestaurantView.findAll({
        where: viewWhere,
        order: [['viewed_at', 'DESC']],
        limit: 3,
        attributes: ['restaurant_id']
      });

      viewedRestaurantIds = views.map(v => v.restaurant_id);
      if (viewedRestaurantIds.length === 0) {
        return res.json({
          success: true,
          data: [],
          count: 0
        });
      }
      whereClause.id = { [Op.in]: viewedRestaurantIds };
    }

    // include options là các model cần join 
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

    // NẾU CÓ CATEGORY_ID THÌ FILTER THEO CATEGORY_ID
    if (category_id) {
      // Filter through many-to-many relationship
      includeOptions[1].where = { id: category_id };
      includeOptions[1].required = true; // INNER JOIN to filter
    }

    const restaurants = await Restaurant.findAll({
      where: whereClause,
      include: includeOptions,
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
        'owner_id',
        'opening_hours',
        'phone_number',
        'website'
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
        statusRaw: restaurantData.status, // Giữ giá trị gốc 'approved'/'pending' để frontend check
        isOpen: restaurantData.is_open,
        tags: categoryNames,
        category: categoryNames[0] || 'Khác',
        categories: categoryNames, // Thêm field mới
        description: restaurantData.description || 'Thông tin đang được cập nhật.',
        price: '$$', // Placeholder, có thể thêm field sau
        latitude: parseFloat(restaurantData.latitude),
        longitude: parseFloat(restaurantData.longitude),
        owner_id: restaurantData.owner_id,
        opening_hours: restaurantData.opening_hours,
        phone_number: restaurantData.phone_number,
        website: restaurantData.website,
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

// Track restaurant view
const trackRestaurantView = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId || null;
    const { session_id } = req.body;

    if (!userId && !session_id) {
      return res.status(400).json({
        success: false,
        message: 'Cần user_id hoặc session_id để track view'
      });
    }

    // Kiểm tra restaurant có tồn tại không
    const restaurant = await Restaurant.findByPk(id);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhà hàng'
      });
    }

    // Tìm view đã tồn tại
    const viewWhere = { restaurant_id: id };
    if (userId) {
      viewWhere.user_id = userId;
    } else {
      viewWhere.session_id = session_id;
    }

    let view = await RestaurantView.findOne({ where: viewWhere });

    if (view) {
      // Cập nhật viewed_at
      view.viewed_at = new Date();
      await view.save();
    } else {
      // Tạo mới
      view = await RestaurantView.create({
        user_id: userId,
        restaurant_id: id,
        session_id: userId ? null : session_id,
        viewed_at: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Đã track view thành công',
      data: view
    });
  } catch (error) {
    console.error('Error tracking restaurant view:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi track view',
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
        'owner_id',
        'opening_hours',
        'phone_number',
        'website'
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
        'status',
        'opening_hours',
        'phone_number',
        'website'
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
      opening_hours,
      phone_number,
      website,
    } = req.body;

    // Validate required fields
    if (!name || !address || !category_id || latitude == null || longitude == null) {
      return res.status(400).json({
        success: false,
        message: 'name, address, category_id, latitude, longitude là bắt buộc',
      });
    }

    // Validate và convert latitude/longitude
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        message: 'latitude và longitude phải là số hợp lệ',
      });
    }

    if (lat < -90 || lat > 90) {
      return res.status(400).json({
        success: false,
        message: 'latitude phải trong khoảng -90 đến 90',
      });
    }

    if (lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: 'longitude phải trong khoảng -180 đến 180',
      });
    }

    // Validate category
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

    // Validate và format opening_hours nếu có
    let formattedOpeningHours = null;
    if (opening_hours) {
      if (typeof opening_hours === 'string') {
        try {
          formattedOpeningHours = JSON.parse(opening_hours);
        } catch (e) {
          console.warn('Invalid opening_hours JSON string:', e);
          formattedOpeningHours = null;
        }
      } else if (typeof opening_hours === 'object' && opening_hours !== null) {
        formattedOpeningHours = opening_hours;
      }
    }

    // Validate image_url length (nếu là base64 có thể rất dài)
    let finalImageUrl = image_url || null;
    if (finalImageUrl && finalImageUrl.length > 500) {
      console.warn('Warning: image_url quá dài, có thể là base64. Cần xử lý upload file thay vì base64.');
      // Có thể cắt ngắn hoặc từ chối, tùy vào yêu cầu
      // Ở đây tôi sẽ giữ nguyên nhưng cảnh báo
    }

    const restaurant = await Restaurant.create({
      category_id: parseInt(category_id),
      name: name.trim(),
      address: address.trim(),
      description: description ? description.trim() : null,
      owner_id: ownerId ? parseInt(ownerId) : null,
      average_rating: 0,
      latitude: lat,
      longitude: lng,
      is_open: true,
      review_count: 0,
      image_url: finalImageUrl,
      status: 'pending',
      opening_hours: formattedOpeningHours,
      phone_number: phone_number ? phone_number.trim() : null,
      website: website ? website.trim() : null,
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
        opening_hours: restaurant.opening_hours,
        phone_number: restaurant.phone_number,
        website: restaurant.website,
      },
    });
  } catch (error) {
    console.error('Error creating restaurant:', error);
    console.error('Error stack:', error.stack);
    console.error('Request body:', JSON.stringify(req.body, null, 2));
    
    // Xử lý lỗi cụ thể
    let errorMessage = 'Lỗi khi tạo nhà hàng';
    if (error.name === 'SequelizeValidationError') {
      errorMessage = 'Dữ liệu không hợp lệ: ' + error.errors.map(e => e.message).join(', ');
    } else if (error.name === 'SequelizeForeignKeyConstraintError') {
      errorMessage = 'Dữ liệu tham chiếu không hợp lệ';
    } else if (error.name === 'SequelizeDatabaseError') {
      errorMessage = 'Lỗi database: ' + error.message;
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
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
      attributes: [
        'id',
        'name',
        'address',
        'status',
        'image_url',
        'description',
        'average_rating',
        'review_count',
        'latitude',
        'longitude',
        'is_open',
        'opening_hours',
        'phone_number',
        'website',
        'owner_id'
      ]
    });

    // Format response để phù hợp với frontend
    const formattedRestaurants = restaurants.map(restaurant => {
      const restaurantData = restaurant.toJSON();
      const moderationStatus = restaurantData.status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt';
      
      return {
        id: restaurantData.id,
        name: restaurantData.name,
        address: restaurantData.address,
        image_url: restaurantData.image_url,
        description: restaurantData.description,
        rating: parseFloat(restaurantData.average_rating) || 0,
        reviews: restaurantData.review_count || 0,
        latitude: parseFloat(restaurantData.latitude),
        longitude: parseFloat(restaurantData.longitude),
        isOpen: restaurantData.is_open,
        opening_hours: restaurantData.opening_hours,
        phone_number: restaurantData.phone_number,
        website: restaurantData.website,
        owner_id: restaurantData.owner_id,
        status: moderationStatus, // Formatted status
        statusRaw: restaurantData.status, // Raw status 'approved'/'pending'
      };
    });

    res.json({
      success: true,
      data: formattedRestaurants
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
  getOwnerRestaurants,
  trackRestaurantView
};

