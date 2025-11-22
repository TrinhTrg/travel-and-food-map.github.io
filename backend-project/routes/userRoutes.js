var express = require('express');
var router = express.Router();
const db = require('../models');
const User = db.User;
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var { requireAuth } = require('../middleware/auth');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '24h'
  });
};

// POST /api/users/register
router.post('/register', async function(req, res, next) {
  try {
    const { name, email, password, role } = req.body;  // ← SỬA: name, email

    if (!name || !email || !password) {  // ← SỬA validation
      return res.status(400).json({
        success: false,
        message: 'Name, email và password là bắt buộc'
      });
    }

    // Check if email exists
    const existingUser = await User.findOne({ where: { email } });
    console.log('🔵 Existing user check:', existingUser);
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email đã tồn tại'
      });
    }

    // Create user
    const user = await User.create({ 
      name, 
      email, 
      password, 
      role: role || 'user' 
    });
    console.log('🔵 User created:', user.id);

    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      data: {
        user: {
          id: user.id,
          name: user.name,      // ← SỬA
          email: user.email,    // ← SỬA
          role: user.role       // ← THÊM
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/users/login
router.post('/login', async function(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email và password là bắt buộc'
      });
    }

    // Find user by email - USING STANDARD SEQUELIZE
    const user = await User.findOne({ where: { email } });
    console.log('🔵 User found for login:', user ? user.id : 'none');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Sai tài khoản hoặc mật khẩu'
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('🔵 Password match:', isMatch);
    
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
          name: user.name,      // ← SỬA: user.name thay vì user.username
          email: user.email,    // ← THÊM: email
          role: user.role       // ← THÊM: role
        },
        token
      }
    });

  } catch (error) {
    next(error);
  }
});

// POST /api/users/logout
router.post('/logout', function(req, res) {
  res.json({
    success: true,
    message: 'Đăng xuất thành công'
  });
});

router.get('/profile', requireAuth, async function(req, res, next) {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: ['id', 'name', 'email', 'role', 'createdAt']
    });
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
});

router.get('/', function(req, res, next) {
  res.json({
    success: true,
    message: 'Users API is working'
  });
});

module.exports = router;