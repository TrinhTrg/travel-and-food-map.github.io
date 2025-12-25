'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. Thêm cột firebase_uid (unique, cho phép null ban đầu để không ảnh hưởng data cũ)
        await queryInterface.addColumn('users', 'firebase_uid', {
            type: Sequelize.STRING(255),
            allowNull: true,
            unique: true,
            after: 'email' // Đặt sau cột email
        });

        // 2. Thêm cột auth_provider
        await queryInterface.addColumn('users', 'auth_provider', {
            type: Sequelize.STRING(50),
            allowNull: false,
            defaultValue: 'local', // Users cũ dùng local auth
            after: 'firebase_uid'
        });

        // 3. Thêm cột avatar
        await queryInterface.addColumn('users', 'avatar', {
            type: Sequelize.STRING(500),
            allowNull: true,
            after: 'auth_provider'
        });

        // 4. Cho phép password null (vì Firebase users không cần password)
        await queryInterface.changeColumn('users', 'password', {
            type: Sequelize.STRING(255),
            allowNull: true
        });

        // 5. Thêm index cho firebase_uid để tối ưu lookup
        await queryInterface.addIndex('users', ['firebase_uid'], {
            unique: true,
            name: 'users_firebase_uid_unique'
        });
    },

    async down(queryInterface, Sequelize) {
        // Rollback: xóa các cột và đưa password về not null
        await queryInterface.removeIndex('users', 'users_firebase_uid_unique');
        await queryInterface.removeColumn('users', 'avatar');
        await queryInterface.removeColumn('users', 'auth_provider');
        await queryInterface.removeColumn('users', 'firebase_uid');

        await queryInterface.changeColumn('users', 'password', {
            type: Sequelize.STRING(255),
            allowNull: false
        });
    }
};
