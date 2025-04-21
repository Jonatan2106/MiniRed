'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('subreddit_member', {
      subreddit_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      joined_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      is_moderator: {
        type: Sequelize.BOOLEAN,
        allowNull: false
      },
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable("subreddit_member");
  }
};
