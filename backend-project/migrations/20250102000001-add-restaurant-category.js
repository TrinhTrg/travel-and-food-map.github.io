'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Kiểm tra xem category "Restaurant" đã tồn tại chưa
    const [existing] = await queryInterface.sequelize.query(
      `SELECT id FROM categories WHERE name = 'Restaurant' OR id = 12 LIMIT 1`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Chỉ insert nếu chưa tồn tại
    if (!existing) {
      await queryInterface.bulkInsert('categories', [{
        id: 12,
        name: 'Restaurant',
        createdAt: new Date(),
        updatedAt: new Date()
      }], {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('categories', { 
      name: 'Restaurant' 
    }, {});
  }
};

