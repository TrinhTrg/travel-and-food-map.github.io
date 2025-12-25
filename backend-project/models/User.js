'use strict';

const { Model } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // User.hasMany(models.Restaurant, { foreignKey: 'userId', as: 'restaurants' });
      // User.hasMany(models.Review, { foreignKey: 'userId', as: 'reviews' });
      // User.hasMany(models.SavedLocation, { foreignKey: 'userId', as: 'savedLocations' });
    }

    static async findByEmail(email) {
      return await User.findOne({ where: { email } });
    }

    static async findById(id) {
      return await User.findByPk(id, {
        attributes: ['id', 'name', 'email', 'role', 'phone_number', 'createdAt']
      });
    }

    // Ghi đè create để tự hash mật khẩu, vẫn dùng được User.create trong controller
    static async create(values, options) {
      const { name, email, password, role = 'user', phone_number } = values;
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      return await super.create(
        { name, email, password: hashedPassword, role, phone_number },
        options
      );
    }

    static async updatePasswordByEmail(email, newPassword) {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      const [affected] = await User.update(
        { password: hashedPassword },
        { where: { email } }
      );

      return affected > 0;
    }

    static async comparePassword(plainPassword, hashedPassword) {
      return await bcrypt.compare(plainPassword, hashedPassword);
    }
  }

  User.init(
    {
      name: {
        type: DataTypes.STRING(150),
        allowNull: false
      },
      email: {
        type: DataTypes.STRING(191),
        allowNull: false,
        unique: true
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      role: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'user'
      },
      phone_number: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'Số điện thoại của người dùng'
      }
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      timestamps: true
    }
  );

  return User;
};