const jwt = require('jsonwebtoken');
const { User } = require('../models');

const ALLOWED_ROLES = ['user', 'owner', 'admin'];

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
};

const validateRegisterInput = (name, email, password, res) => {
  if (!name || !email || !password) {
    res.status(400).json({
      success: false,
      message: 'Name, email và password là bắt buộc'
    });
    return false;
  }

  // Thêm email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({
      success: false,
      message: 'Email không hợp lệ'
    });
    return false;
  }

  if (password.length < 6) {
    res.status(400).json({
      success: false,
      message: 'Password phải có ít nhất 6 ký tự'
    });
    return false;
  }

  return true;
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!validateRegisterInput(name, email, password, res)) {
      return;
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng'
      });
    }

    if (role && !ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role không hợp lệ'
      });
    }

    const finalRole = role || 'user';

    const user = await User.create({ name, email, password, role: finalRole });
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email và password là bắt buộc'
      });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Sai tài khoản hoặc mật khẩu'
      });
    }
    const isMatch = await User.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Sai tài khoản hoặc mật khẩu'
      });
    }

    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = (req, res) => {
  res.json({
    success: true,
    message: 'Đăng xuất thành công'
  });
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email và mật khẩu mới là bắt buộc'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
      });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Email không tồn tại trong hệ thống'
      });
    }

    await User.updatePasswordByEmail(email, newPassword);

    res.json({
      success: true,
      message: 'Đặt lại mật khẩu thành công'
    });
  } catch (error) {
    next(error);
  }
};

// SỬA getProfile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id); // Sửa thành req.user.id
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User không tồn tại'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

exports.healthCheck = (req, res) => {
  res.json({
    success: true,
    message: 'Users API is working'
  });
};