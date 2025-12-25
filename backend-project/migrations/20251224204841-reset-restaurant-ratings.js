'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Reset tất cả restaurants về 0 đánh giá và 0 sao
    await queryInterface.sequelize.query(`
      UPDATE restaurants 
      SET 
        average_rating = 0,
        review_count = 0,
        updatedAt = CURRENT_TIMESTAMP
      WHERE average_rating > 0 OR review_count > 0
    `);
    
    console.log('✅ Đã reset tất cả ratings và review_count về 0');
  },

  async down(queryInterface, Sequelize) {
    // Không thể rollback vì không lưu giá trị cũ
    // Chỉ log thông báo
    console.log('⚠️ Không thể rollback reset ratings. Cần restore từ backup nếu cần.');
  }
};
