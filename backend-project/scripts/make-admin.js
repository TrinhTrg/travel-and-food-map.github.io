const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const db = require('../models');
const { User } = db;

async function makeAdmin() {
  try {
    // Lấy email từ command line argument hoặc environment variable
    const email = process.argv[2] || process.env.ADMIN_EMAIL;

    if (!email) {
      console.error('Vui lòng cung cấp email!');
      process.exit(1);
    }
    
    const user = await User.findOne({ where: { email } });

    if (!user) {
      console.error(`Không tìm thấy user với email: ${email}`);
      process.exit(1);
    }
    if (user.role === 'admin') {
      console.log(`User ${email} đã là admin rồi!`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      process.exit(0);
    }

    // Nâng cấp thành admin
    await user.update({ role: 'admin' });

    console.log(`\nĐã nâng cấp user thành admin thành công!`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Role: ${user.role} (đã cập nhật)`);

    process.exit(0);
  } catch (error) {
    console.error('Lỗi khi nâng cấp user:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    // Đóng kết nối database
    if (db.sequelize) {
      await db.sequelize.close();
    }
  }
}

// Chạy script
makeAdmin();

