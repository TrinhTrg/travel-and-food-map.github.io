'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Restaurant extends Model {
    static associate(models) {
      // Giữ lại belongsTo để backward compatibility
      Restaurant.belongsTo(models.Category, {
        foreignKey: 'category_id',
        as: 'category'
      });

      // Many-to-many relationship với categories
      Restaurant.belongsToMany(models.Category, {
        through: 'restaurant_categories',
        foreignKey: 'restaurant_id',
        otherKey: 'category_id',
        as: 'categories'
      });

      Restaurant.belongsTo(models.User, {
        foreignKey: 'owner_id',
        as: 'owner'
      });
    }
  }
  Restaurant.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    address: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    owner_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    average_rating: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.0
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false
    },
    is_open: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    review_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    image_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved'),
      allowNull: false,
      defaultValue: 'pending'
    },
    opening_hours: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Giờ mở cửa theo từng ngày trong tuần'
    },
    phone_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Số điện thoại của nhà hàng'
    },
    website: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Website của nhà hàng'
    }
  }, {
    sequelize,
    modelName: 'Restaurant',
    tableName: 'restaurants',
    timestamps: true
  });
  return Restaurant;
};

