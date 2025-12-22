'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Category extends Model {
    static associate(models) {
      // Giữ lại hasMany để backward compatibility
      Category.hasMany(models.Restaurant, {
        foreignKey: 'category_id',
        as: 'restaurants'
      });
      
      // Many-to-many relationship với restaurants
      Category.belongsToMany(models.Restaurant, {
        through: 'restaurant_categories',
        foreignKey: 'category_id',
        otherKey: 'restaurant_id',
        as: 'restaurantsMany'
      });
    }
  }
  Category.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    }
  }, {
    sequelize,
    modelName: 'Category',
    tableName: 'categories',
    timestamps: true
  });
  return Category;
};

