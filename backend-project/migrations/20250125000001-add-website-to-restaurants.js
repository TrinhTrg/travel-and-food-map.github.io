'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('restaurants', 'website', {
      type: Sequelize.STRING(500),
      allowNull: true,
      comment: 'Website của nhà hàng'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('restaurants', 'website');
  }
};


