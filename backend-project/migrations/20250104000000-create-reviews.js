'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Tạo bảng reviews
        await queryInterface.createTable('reviews', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
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
            rating: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            content: {
                type: Sequelize.TEXT,
                allowNull: true
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

        // Unique constraint - mỗi user chỉ review 1 lần mỗi restaurant
        await queryInterface.addIndex('reviews', ['user_id', 'restaurant_id'], {
            unique: true,
            name: 'unique_user_restaurant_review'
        });

        // Tạo bảng image_reviews
        await queryInterface.createTable('image_reviews', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            review_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'reviews',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            image_url: {
                type: Sequelize.STRING(500),
                allowNull: false
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

        // Index cho review_id để tăng tốc query
        await queryInterface.addIndex('image_reviews', ['review_id']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('image_reviews');
        await queryInterface.dropTable('reviews');
    }
};
