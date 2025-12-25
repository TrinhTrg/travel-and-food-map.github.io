const { Sequelize } = require('sequelize');
require('dotenv').config();

// Tạo kết nối đến MySQL
const rootConnection = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  logging: false, 
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
    await sequelize.sync({ force: false });
    console.log('All tables created or already exist');
  } catch (err) {
    console.error('Cannot create tables:', err.message);
    throw err;
  }
};

module.exports = {
  sequelize,         
  createDatabase,
  createUsersTable
};