'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class RestaurantCategory extends Model {
    static associate(models) {
      // Associations are defined in Restaurant and Category models
    }
  }
  RestaurantCategory.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    restaurant_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'restaurants',
        key: 'id'
      }
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'categories',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'RestaurantCategory',
    tableName: 'restaurant_categories',
    timestamps: true
  });
  return RestaurantCategory;
};

