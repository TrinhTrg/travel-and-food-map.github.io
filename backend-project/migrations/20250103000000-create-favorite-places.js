'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('favorite_places', {
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

        // Thêm unique constraint để đảm bảo một user không thể yêu thích cùng một restaurant 2 lần
        await queryInterface.addIndex('favorite_places', ['user_id', 'restaurant_id'], {
            unique: true,
            name: 'unique_user_restaurant_favorite'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('favorite_places');
    }
};
