'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const categories = [
      { id: 1, name: 'Cafe', createdAt: new Date(), updatedAt: new Date() },
      { id: 2, name: 'Fast Food', createdAt: new Date(), updatedAt: new Date() },
      { id: 3, name: 'BBQ', createdAt: new Date(), updatedAt: new Date() },
      { id: 4, name: 'Japanese', createdAt: new Date(), updatedAt: new Date() },
      { id: 5, name: 'Vietnamese', createdAt: new Date(), updatedAt: new Date() },
      { id: 6, name: 'Dessert', createdAt: new Date(), updatedAt: new Date() },
      { id: 7, name: 'Seafood', createdAt: new Date(), updatedAt: new Date() },
      { id: 8, name: 'Italian', createdAt: new Date(), updatedAt: new Date() },
      { id: 9, name: 'Korean', createdAt: new Date(), updatedAt: new Date() },
      { id: 10, name: 'Chinese', createdAt: new Date(), updatedAt: new Date() },
      { id: 11, name: 'Chè', createdAt: new Date(), updatedAt: new Date() }
    ];

    await queryInterface.bulkInsert('categories', categories, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('categories', null, {});
  }
};

