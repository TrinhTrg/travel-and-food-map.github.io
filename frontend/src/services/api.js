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

export default apiCall;