const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('db_slps', 'root', '', {
    host: 'localhost',
    dialect: 'mysql'
});
module.exports = sequelize;