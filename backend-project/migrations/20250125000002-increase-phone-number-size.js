'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('restaurants', 'phone_number', {
      type: Sequelize.STRING(50),
      allowNull: true,
      comment: 'Số điện thoại của nhà hàng'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn('restaurants', 'phone_number', {
      type: Sequelize.STRING(20),
      allowNull: true,
    });
  }
};


