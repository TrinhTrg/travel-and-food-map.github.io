'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // MySQL không cho phép xóa unique index nếu nó đang được sử dụng bởi foreign key
        // Giải pháp: Tạm thời xóa foreign key constraints, xóa unique index, rồi tạo lại foreign keys
        
        // Lấy tên foreign key constraints
        const [foreignKeys] = await queryInterface.sequelize.query(`
            SELECT CONSTRAINT_NAME 
            FROM information_schema.KEY_COLUMN_USAGE 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'reviews' 
            AND REFERENCED_TABLE_NAME IS NOT NULL
        `);

        const fkNames = foreignKeys.map(fk => fk.CONSTRAINT_NAME);
        
        // Tạm thời xóa foreign key constraints
        for (const fkName of fkNames) {
            try {
                await queryInterface.sequelize.query(`
                    ALTER TABLE reviews DROP FOREIGN KEY \`${fkName}\`
                `);
            } catch (err) {
                console.log(`Foreign key ${fkName} có thể không tồn tại:`, err.message);
            }
        }

        // Xóa unique index
        try {
            await queryInterface.sequelize.query(`
                ALTER TABLE reviews DROP INDEX unique_user_restaurant_review
            `);
        } catch (err) {
            console.log('Unique index có thể đã bị xóa:', err.message);
        }

        // Tạo lại foreign key constraints
        try {
            await queryInterface.sequelize.query(`
                ALTER TABLE reviews 
                ADD CONSTRAINT reviews_user_id_fk 
                FOREIGN KEY (user_id) REFERENCES users(id) 
                ON DELETE CASCADE ON UPDATE CASCADE
            `);
        } catch (err) {
            console.log('Foreign key user_id có thể đã tồn tại:', err.message);
        }

        try {
            await queryInterface.sequelize.query(`
                ALTER TABLE reviews 
                ADD CONSTRAINT reviews_restaurant_id_fk 
                FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) 
                ON DELETE CASCADE ON UPDATE CASCADE
            `);
        } catch (err) {
            console.log('Foreign key restaurant_id có thể đã tồn tại:', err.message);
        }

        // Tạo lại index không unique để tối ưu query
        try {
            await queryInterface.addIndex('reviews', ['user_id', 'restaurant_id'], {
                unique: false,
                name: 'idx_user_restaurant_review'
            });
        } catch (err) {
            console.log('Index có thể đã tồn tại:', err.message);
        }
    },

    async down(queryInterface, Sequelize) {
        // Xóa index không unique
        try {
            await queryInterface.removeIndex('reviews', 'idx_user_restaurant_review');
        } catch (error) {
            console.log('Index không tồn tại:', error.message);
        }

        // Kiểm tra xem unique constraint đã tồn tại chưa
        const [indexes] = await queryInterface.sequelize.query(`
            SHOW INDEX FROM reviews WHERE Key_name = 'unique_user_restaurant_review'
        `);

        // Chỉ tạo lại nếu chưa tồn tại
        if (indexes.length === 0) {
            await queryInterface.addIndex('reviews', ['user_id', 'restaurant_id'], {
                unique: true,
                name: 'unique_user_restaurant_review'
            });
        }
    }
};

