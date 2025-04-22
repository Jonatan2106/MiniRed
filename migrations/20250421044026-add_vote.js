'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('vote', {
      vote_id: {
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
      kategori_id: {
        type: Sequelize.UUID,
        allowNull: false
      },
      kategori_type: {
        type: Sequelize.ENUM("POST", "COMMENT"),
        allowNull: false
      },
      vote_type: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable("vote");
  }
};
