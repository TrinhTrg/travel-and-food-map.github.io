'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class FavoritePlace extends Model {
        static associate(models) {
            // Liên kết với User
            FavoritePlace.belongsTo(models.User, {
                foreignKey: 'user_id',
                as: 'user'
            });

            // Liên kết với Restaurant
            FavoritePlace.belongsTo(models.Restaurant, {
                foreignKey: 'restaurant_id',
                as: 'restaurant'
            });
        }
    }

    FavoritePlace.init({
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
        }
    }, {
        sequelize,
        modelName: 'FavoritePlace',
        tableName: 'favorite_places',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['user_id', 'restaurant_id']
            }
        ]
    });

    return FavoritePlace;
};
