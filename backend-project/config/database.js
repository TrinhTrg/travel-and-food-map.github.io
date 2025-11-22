const { Sequelize } = require('sequelize');
require('dotenv').config();

// Tạo kết nối đến MySQL
const rootConnection = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  logging: false, // Tắt logging để tránh spam console
});

// Kết nối đến database chính
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,
  }
);

const createDatabase = async () => {
  try {
    // Tạo database nếu chưa tồn tại
    await rootConnection.query(
      `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`
    );
    console.log('Database created or already exists');
  } catch (err) {
    console.error('Cannot create database:', err.message);
    throw err;
  }
};

const createUsersTable = async () => {
  try {
    // Đồng bộ hóa tất cả models (tạo bảng)
    await sequelize.sync({ force: false }); // force: false = không xóa bảng cũ
    console.log('All tables created or already exist');
  } catch (err) {
    console.error('Cannot create tables:', err.message);
    throw err;
  }
};

module.exports = {
  sequelize,          // Export để dùng trong models
  createDatabase,
  createUsersTable
};