'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('restaurant_views', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true, // Cho phép null để hỗ trợ anonymous users
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      session_id: {
        type: Sequelize.STRING(255),
        allowNull: true, // Session ID cho anonymous users
        comment: 'Session ID từ frontend để track anonymous users'
      },
      viewed_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Index để query nhanh hơn
    await queryInterface.addIndex('restaurant_views', ['user_id', 'viewed_at'], {
      name: 'idx_user_viewed_at'
    });
    await queryInterface.addIndex('restaurant_views', ['session_id', 'viewed_at'], {
      name: 'idx_session_viewed_at'
    });
    await queryInterface.addIndex('restaurant_views', ['restaurant_id'], {
      name: 'idx_restaurant_id'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('restaurant_views');
  }
};

