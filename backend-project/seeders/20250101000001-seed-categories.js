'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const categories = [
      { id: 1, name: 'Coffee', createdAt: new Date(), updatedAt: new Date() },
      { id: 2, name: 'Fast Food', createdAt: new Date(), updatedAt: new Date() },
      { id: 3, name: 'BBQ', createdAt: new Date(), updatedAt: new Date() },
      { id: 4, name: 'Vietnamese', createdAt: new Date(), updatedAt: new Date() },
      { id: 5, name: 'Dessert', createdAt: new Date(), updatedAt: new Date() },
      { id: 6, name: 'Seafood', createdAt: new Date(), updatedAt: new Date() },
      { id: 7, name: 'Ice Cream', createdAt: new Date(), updatedAt: new Date() },
      { id: 8, name: 'Bar', createdAt: new Date(), updatedAt: new Date() },
      { id: 9, name: 'Chè', createdAt: new Date(), updatedAt: new Date() },
      { id: 10, name: 'Restaurant', createdAt: new Date(), updatedAt: new Date() }
    ];

    await queryInterface.bulkInsert('categories', categories, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('categories', null, {});
  }
};

