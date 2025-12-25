const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Helper function để gọi API
const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  // Xử lý body data
  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
};

// Authentication API
export const authAPI = {
  register: async (userData) => {
    return apiCall('/users/register', {
      method: 'POST',
      body: userData, // Nhận toàn bộ object userData
    });
  },

  login: async (email, password) => {
    return apiCall('/users/login', {
      method: 'POST',
      body: { email, password }, // Dùng email thay vì username
    });
  },
  forgotPassword: async (email, newPassword) => {
    return apiCall('/users/forgot-password', {
      method: 'POST',
      body: { email, newPassword },
    });
  },

  logout: async () => {
    return apiCall('/users/logout', {
      method: 'POST',
    });
  },

  getProfile: async () => {
    return apiCall('/users/profile', {
      method: 'GET',
    });
  },

  updateProfile: async (profileData) => {
    return apiCall('/users/profile', {
      method: 'PUT',
      body: profileData,
    });
  },

  loginWithFirebase: async (idToken) => {
    return apiCall('/auth/firebase-login', {
      method: 'POST',
      body: { idToken },
    });
  },
};

// Admin API
export const adminAPI = {
  getStats: async () => {
    return apiCall('/admin/stats', {
      method: 'GET',
    });
  },

  getPendingRestaurants: async () => {
    return apiCall('/admin/restaurants/pending', {
      method: 'GET',
    });
  },

  approveRestaurant: async (id) => {
    return apiCall(`/admin/restaurants/${id}/approve`, {
      method: 'PUT',
    });
  },

  rejectRestaurant: async (id) => {
    return apiCall(`/admin/restaurants/${id}/reject`, {
      method: 'DELETE',
    });
  },

  getUsers: async () => {
    return apiCall('/admin/users', {
      method: 'GET',
    });
  },

  updateUserRole: async (id, role) => {
    return apiCall(`/admin/users/${id}/role`, {
      method: 'PUT',
      body: { role },
    });
  },
};

// Contact API
export const contactAPI = {
  sendContact: async (contactData) => {
    return apiCall('/contact', {
      method: 'POST',
      body: contactData,
    });
  },
};

// Search API
export const searchAPI = {
  autocomplete: async (query, limit = 10) => {
    return apiCall(`/search/autocomplete?q=${encodeURIComponent(query)}&limit=${limit}`, {
      method: 'GET',
    });
  },

  search: async (query, options = {}) => {
    const params = new URLSearchParams({ q: query, ...options });
    return apiCall(`/search?${params.toString()}`, {
      method: 'GET',
    });
  },
};

// Favorite Places API
export const favoriteAPI = {
  // Lấy danh sách địa điểm yêu thích
  getFavorites: async () => {
    return apiCall('/favorites', {
      method: 'GET',
    });
  },

  // Lấy danh sách ID địa điểm yêu thích
  getFavoriteIds: async () => {
    return apiCall('/favorites/ids', {
      method: 'GET',
    });
  },

  // Thêm địa điểm vào yêu thích
  addFavorite: async (restaurantId) => {
    return apiCall('/favorites', {
      method: 'POST',
      body: { restaurantId },
    });
  },

  // Kiểm tra địa điểm có trong yêu thích không
  checkFavorite: async (restaurantId) => {
    return apiCall(`/favorites/check/${restaurantId}`, {
      method: 'GET',
    });
  },

  // Xóa địa điểm khỏi yêu thích
  removeFavorite: async (restaurantId) => {
    return apiCall(`/favorites/${restaurantId}`, {
      method: 'DELETE',
    });
  },
};

// Review API
export const reviewAPI = {
  // Lấy tất cả reviews của một restaurant
  getReviewsByRestaurant: async (restaurantId) => {
    return apiCall(`/reviews/restaurant/${restaurantId}`, {
      method: 'GET',
    });
  },

  // Lấy review của user cho restaurant cụ thể
  getUserReview: async (restaurantId) => {
    return apiCall(`/reviews/user/${restaurantId}`, {
      method: 'GET',
    });
  },

  // Lấy số lượng reviews của user hiện tại
  getUserReviewCount: async () => {
    return apiCall('/reviews/user-count', {
      method: 'GET',
    });
  },

  // Lấy tất cả reviews của user hiện tại (với thông tin restaurant)
  getUserReviews: async () => {
    return apiCall('/reviews/user', {
      method: 'GET',
    });
  },

  // Tạo hoặc cập nhật review
  createOrUpdateReview: async (data) => {
    return apiCall('/reviews', {
      method: 'POST',
      body: data,
    });
  },

  // Upload ảnh review (sử dụng FormData)
  uploadImages: async (files) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();

    files.forEach(file => {
      formData.append('images', file);
    });

    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/reviews/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Upload failed');
    }

    return data;
  },

  // Xóa review
  deleteReview: async (reviewId) => {
    return apiCall(`/reviews/${reviewId}`, {
      method: 'DELETE',
    });
  },
};

// Menu Item API
export const menuItemAPI = {
  // ============ PUBLIC ============
  // Lấy menu của restaurant
  getMenuByRestaurant: async (restaurantId, options = {}) => {
    const params = new URLSearchParams(options);
    return apiCall(`/menu-items/restaurant/${restaurantId}?${params.toString()}`, {
      method: 'GET',
    });
  },

  // ============ OWNER ============
  // Lấy tất cả menu items của owner
  getOwnerMenuItems: async () => {
    return apiCall('/menu-items/owner', {
      method: 'GET',
    });
  },

  // Tạo menu item mới
  createMenuItem: async (formData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/menu-items`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Create failed');
    }
    return data;
  },

  // Cập nhật menu item
  updateMenuItem: async (id, formData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/menu-items/${id}`, {
      method: 'PUT',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Update failed');
    }
    return data;
  },

  // Xóa menu item
  deleteMenuItem: async (id) => {
    return apiCall(`/menu-items/${id}`, {
      method: 'DELETE',
    });
  },

  // Upload ảnh
  uploadImage: async (file) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/menu-items/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Upload failed');
    }
    return data;
  },

  // ============ ADMIN ============
  // Lấy danh sách chờ duyệt
  getPendingMenuItems: async () => {
    return apiCall('/menu-items/pending', {
      method: 'GET',
    });
  },

  // Phê duyệt
  approveMenuItem: async (id) => {
    return apiCall(`/menu-items/${id}/approve`, {
      method: 'PATCH',
    });
  },

  // Từ chối
  rejectMenuItem: async (id, reason) => {
    return apiCall(`/menu-items/${id}/reject`, {
      method: 'PATCH',
      body: { reason },
    });
  },
};

// Restaurant API
export const restaurantAPI = {
  // Lấy tất cả nhà hàng (dùng cho admin)
  getAllRestaurants: async () => {
    return apiCall('/restaurants', {
      method: 'GET',
    });
  },

  // Lấy danh sách nhà hàng của owner
  getOwnerRestaurants: async () => {
    return apiCall('/restaurants/owner', {
      method: 'GET',
    });
  },
};

export default apiCall;