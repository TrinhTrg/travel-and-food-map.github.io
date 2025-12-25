'use strict';
const bcrypt = require('bcryptjs');
require('dotenv').config();

module.exports = {
  async up (queryInterface, Sequelize) {
    // Sử dụng biến môi trường hoặc giá trị mặc định
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@foodgo.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    const adminName = process.env.ADMIN_NAME || 'Super Admin';

    // Kiểm tra xem admin đã tồn tại chưa
    const existingAdmin = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = :email`,
      {
        replacements: { email: adminEmail },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    if (existingAdmin.length > 0) {
      console.log(`Admin với email ${adminEmail} đã tồn tại, bỏ qua...`);
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    await queryInterface.bulkInsert('users', [{ 
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});

    console.log(`Đã tạo admin: ${adminEmail}`);
  },

  async down (queryInterface, Sequelize) {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@foodgo.com';
    await queryInterface.bulkDelete('users', { email: adminEmail }, {});
  }
};