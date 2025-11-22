var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
require('dotenv').config();

// Import database functions
var { createDatabase, createUsersTable } = require('./config/database');


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/userRoutes');

var app = express();

// Hàm khởi tạo database
const initializeDatabase = async () => {
  try {
    console.log('🔄 Đang khởi tạo database...');
    await createDatabase();     // Tạo database trước
    await createUsersTable();   // Sau đó tạo bảng
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    console.log('Server sẽ tiếp tục chạy nhưng có thể gặp lỗi database');
  }
};

// Khởi tạo database (không chặn server startup)
initializeDatabase();
const appPort = process.env.PORT || 3000;
const appHost = process.env.HOST || 'localhost';
// CORS setup
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));


// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

console.log(`🚀 API server chuẩn bị phục vụ tại http://${appHost}:${appPort}`);

// Routes
app.use('/api/users', usersRouter);
app.use('/api', indexRouter);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // log error
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);

  // return JSON error
  res.status(err.status || 500);
  res.json({
    success: false,
    message: err.message,
    ...(req.app.get('env') === 'development' && { stack: err.stack })
  });
});

// Export app
module.exports = app;