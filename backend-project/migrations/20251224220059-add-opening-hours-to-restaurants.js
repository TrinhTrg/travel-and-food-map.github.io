'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('restaurants', 'opening_hours', {
      type: Sequelize.JSON,
      allowNull: true,
      comment: 'Giờ mở cửa theo từng ngày trong tuần'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('restaurants', 'opening_hours');
  }
};
