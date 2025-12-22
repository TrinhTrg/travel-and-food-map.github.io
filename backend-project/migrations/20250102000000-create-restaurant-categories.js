'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Tạo bảng trung gian restaurant_categories
    await queryInterface.createTable('restaurant_categories', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      restaurant_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'restaurants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Tạo unique constraint để tránh duplicate
    await queryInterface.addIndex('restaurant_categories', ['restaurant_id', 'category_id'], {
      unique: true,
      name: 'unique_restaurant_category'
    });

    // Migrate dữ liệu từ category_id cũ sang bảng mới
    await queryInterface.sequelize.query(`
      INSERT INTO restaurant_categories (restaurant_id, category_id, createdAt, updatedAt)
      SELECT id, category_id, createdAt, updatedAt
      FROM restaurants
      WHERE category_id IS NOT NULL
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('restaurant_categories');
  }
};

