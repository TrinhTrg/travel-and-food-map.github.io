const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Cấu hình
const ALLOWED_ROLES = ['user', 'owner', 'admin'];
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// --- HELPER FUNCTIONS ---

// Tạo Token
const generateToken = (userId) => {
  return jwt.sign(
    { userId }, // Payload chứa userId
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Hàm validate đầu vào (Trả về null nếu OK, trả về string lỗi nếu sai)
const validateRegisterInput = (name, email, password) => {
  if (!name || !email || !password) {
    return 'Tên, email và mật khẩu là bắt buộc';
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Định dạng email không hợp lệ';
  }

  if (password.length < 6) {
    return 'Mật khẩu phải có ít nhất 6 ký tự';
  }

  return null; // Không có lỗi
};

// --- CONTROLLERS ---

const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone_number } = req.body;

    // 1. Validate đầu vào
    const errorMsg = validateRegisterInput(name, email, password);
    if (errorMsg) {
      return res.status(400).json({ success: false, message: errorMsg });
    }

    // 2. Validate Role (bảo mật)
    if (role && !ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: 'Role không hợp lệ' });
    }
    const finalRole = role || 'user';

    // 3. Kiểm tra Email tồn tại (Dùng hàm static của Model)
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email đã được sử dụng' });
    }

    // 4. Tạo User (Model User.js đã tự hash password rồi, ko cần làm ở đây)
    const user = await User.create({ 
      name, 
      email, 
      password, 
      role: finalRole,
      phone_number: phone_number || null
    });

    // 5. Tạo Token trả về luôn để user đăng nhập ngay
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone_number: user.phone_number
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu' });
    }

    // 1. Tìm User
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Sai tài khoản hoặc mật khẩu' });
    }

    // 2. So sánh Password (Dùng hàm static của Model)
    const isMatch = await User.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Sai tài khoản hoặc mật khẩu' });
    }

    // 3. Tạo Token
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone_number: user.phone_number
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    // LƯU Ý QUAN TRỌNG: 
    // Middleware auth thường gán userId vào req.userId
    // Nếu middleware gán req.user thì dùng req.user.id
    // Ở đây tôi dùng req.userId cho khớp với hàm generateToken({ userId })
    const userId = req.userId || (req.user && req.user.id);

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User không tồn tại' });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

const logout = (req, res) => {
  res.json({ success: true, message: 'Đăng xuất thành công' });
};

// Lưu ý: Hàm này chưa bảo mật (Reset không cần token email), chỉ dùng cho Demo
const forgotPassword = async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Thông tin không hợp lệ' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Email không tồn tại' });
    }

    // Model User.js đã có hàm updatePasswordByEmail tự hash pass mới
    await User.updatePasswordByEmail(email, newPassword);

    res.json({ success: true, message: 'Đặt lại mật khẩu thành công' });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const userId = req.userId || (req.user && req.user.id);
    const { name, phone_number } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User không tồn tại' });
    }

    // Validate và cập nhật
    const updateData = {};
    if (name !== undefined) {
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Tên không được để trống' });
      }
      updateData.name = name.trim();
    }

    if (phone_number !== undefined) {
      // Validate phone number format (optional, có thể để null)
      if (phone_number && phone_number.trim()) {
        // Basic validation: chỉ cho phép số, dấu +, dấu cách, dấu gạch ngang
        const phoneRegex = /^[\d\s\+\-\(\)]+$/;
        if (!phoneRegex.test(phone_number.trim())) {
          return res.status(400).json({ 
            success: false, 
            message: 'Số điện thoại không hợp lệ' 
          });
        }
        updateData.phone_number = phone_number.trim();
      } else {
        updateData.phone_number = null;
      }
    }

    // Cập nhật user
    await user.update(updateData);

    // Lấy lại user với phone_number
    const updatedUser = await User.findById(userId);

    res.json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    next(error);
  }
};

const healthCheck = (req, res) => {
  res.json({ success: true, message: 'Users API is working' });
};

// Xuất ra một object gọn gàng
module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  logout,
  forgotPassword,
  healthCheck
};