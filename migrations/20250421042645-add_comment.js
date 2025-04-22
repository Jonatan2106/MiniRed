'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('comment', {
      comment_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'user', 
          key: 'user_id'    
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      post_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'post', 
          key: 'post_id'    
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      parent_comment_id: {
        type: Sequelize.UUID,
        allowNull: false
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: true
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
    await queryInterface.dropTable("comment");
  }
};
