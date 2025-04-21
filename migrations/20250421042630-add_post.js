'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('post', {
      post_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false
      },
      subreddit_id: {
        type: Sequelize.UUID,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      image: {
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
    await queryInterface.dropTable("post");
  }
};
