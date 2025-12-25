'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('restaurants', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      address: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      owner_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      average_rating: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0.0
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: false,
        validate: {
          min: -90,
          max: 90
        }
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: false,
        validate: {
          min: -180,
          max: 180
        }
      },
      is_open: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      review_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      image_url: {
        type: Sequelize.TEXT, // Đã tăng từ STRING(500) lên TEXT
        allowNull: true
      },
      phone_number: {
        type: Sequelize.STRING(50), // Đã tăng từ STRING(20) lên STRING(50)
        allowNull: true,
        comment: 'Số điện thoại của nhà hàng'
      },
      opening_hours: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Giờ mở cửa theo từng ngày trong tuần'
      },
      website: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'Website của nhà hàng'
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved'),
        allowNull: false,
        defaultValue: 'pending'
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

    // Tạo index cho category_id để tối ưu query
    await queryInterface.addIndex('restaurants', ['category_id'], {
      name: 'idx_restaurants_category_id'
    });

    // Tạo index cho latitude, longitude để tối ưu tìm kiếm theo vị trí
    await queryInterface.addIndex('restaurants', ['latitude', 'longitude'], {
      name: 'idx_restaurants_location'
    });

    // Tạo index cho status để filter nhanh
    await queryInterface.addIndex('restaurants', ['status'], {
      name: 'idx_restaurants_status'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('restaurants');
  }
};

