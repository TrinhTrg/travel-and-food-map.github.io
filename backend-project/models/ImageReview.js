'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class ImageReview extends Model {
        static associate(models) {
            // Liên kết với Review
            ImageReview.belongsTo(models.Review, {
                foreignKey: 'review_id',
                as: 'review'
            });
        }
    }

    ImageReview.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        review_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'reviews',
                key: 'id'
            }
        },
        image_url: {
            type: DataTypes.STRING(500),
            allowNull: false
        }
    }, {
        sequelize,
        modelName: 'ImageReview',
        tableName: 'image_reviews',
        timestamps: true
    });

    return ImageReview;
};
