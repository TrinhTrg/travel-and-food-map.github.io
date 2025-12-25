'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(191),
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: true // Cho phép null vì Firebase users không cần password
      },
      firebase_uid: {
        type: Sequelize.STRING(255),
        allowNull: true,
        unique: true
      },
      auth_provider: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'local'
      },
      avatar: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      phone_number: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: 'Số điện thoại của người dùng'
      },
      role: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'user'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Thêm index cho firebase_uid để tối ưu lookup
    await queryInterface.addIndex('users', ['firebase_uid'], {
      unique: true,
      name: 'users_firebase_uid_unique'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  }
};

