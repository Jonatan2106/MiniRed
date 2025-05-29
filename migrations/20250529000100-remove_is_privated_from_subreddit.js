'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
    async up(queryInterface, Sequelize) {
        await queryInterface.removeColumn('subreddit', 'is_privated');
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.addColumn('subreddit', 'is_privated', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
        });
    }
};
