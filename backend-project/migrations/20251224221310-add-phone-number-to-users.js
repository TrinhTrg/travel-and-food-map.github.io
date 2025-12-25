'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'phone_number', {
      type: Sequelize.STRING(20),
      allowNull: true,
      comment: 'Số điện thoại của người dùng'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'phone_number');
  }
};
