'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('user', {
      user_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      user_type: {
        type: Sequelize.ENUM("ADMIN", "USER"), 
        allowNull: false,
        defaultValue: "USER"
      },
      profile_pic: {
        type: Sequelize.BLOB,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable("user");
  }
};
