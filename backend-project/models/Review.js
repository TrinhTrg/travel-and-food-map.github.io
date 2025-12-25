'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Review extends Model {
        static associate(models) {
            // Liên kết với User
            Review.belongsTo(models.User, {
                foreignKey: 'user_id',
                as: 'user'
            });

            // Liên kết với Restaurant
            Review.belongsTo(models.Restaurant, {
                foreignKey: 'restaurant_id',
                as: 'restaurant'
            });

            // Liên kết với ImageReview (một review có nhiều ảnh)
            Review.hasMany(models.ImageReview, {
                foreignKey: 'review_id',
                as: 'images'
            });
        }
    }

    Review.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        restaurant_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'restaurants',
                key: 'id'
            }
        },
        rating: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 5
            }
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'Review',
        tableName: 'reviews',
        timestamps: true,
        indexes: [
            // Đã xóa unique constraint để cho phép user review nhiều lần
            // Index không unique để tăng tốc query
            {
                fields: ['user_id', 'restaurant_id'],
                name: 'idx_user_restaurant_review'
            }
        ]
    });

    return Review;
};
