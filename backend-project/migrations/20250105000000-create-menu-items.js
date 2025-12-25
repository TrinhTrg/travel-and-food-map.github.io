'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('menu_items', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
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
            name: {
                type: Sequelize.STRING(200),
                allowNull: false
            },
            price: {
                type: Sequelize.DECIMAL(15, 2),
                allowNull: false,
                defaultValue: 0
            },
            image_url: {
                type: Sequelize.STRING(500),
                allowNull: true
            },
            category: {
                type: Sequelize.ENUM('appetizer', 'main_course', 'dessert', 'drink', 'other'),
                allowNull: false,
                defaultValue: 'other'
            },
            is_popular: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },
            status: {
                type: Sequelize.ENUM('pending_approval', 'approved', 'rejected'),
                allowNull: false,
                defaultValue: 'pending_approval'
            },
            rejection_reason: {
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

        // Thêm index cho restaurant_id để tối ưu query
        await queryInterface.addIndex('menu_items', ['restaurant_id']);

        // Thêm index cho status để tối ưu query lọc theo trạng thái
        await queryInterface.addIndex('menu_items', ['status']);

        // Thêm index cho category để tối ưu query lọc theo danh mục
        await queryInterface.addIndex('menu_items', ['category']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('menu_items');
    }
};
