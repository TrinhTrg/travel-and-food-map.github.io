'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Thay đổi image_url từ STRING(500) sang TEXT để hỗ trợ base64 images
    await queryInterface.changeColumn('restaurants', 'image_url', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down (queryInterface, Sequelize) {
    // Revert về STRING(500)
    await queryInterface.changeColumn('restaurants', 'image_url', {
      type: Sequelize.STRING(500),
      allowNull: true,
    });
  }
};
