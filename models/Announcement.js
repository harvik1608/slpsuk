
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Announcement = sequelize.define('Announcement', {
    name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    message: {
        type: DataTypes.TEXT("long"),
        allowNull: true
    },
    isDisplayFrontend: {
        type: DataTypes.TINYINT,
        allowNull: false
    },
    avatar: {
        type: DataTypes.STRING,
        allowNull: true
    },
    backgroundAvatar: {
        type: DataTypes.STRING,
        allowNull: true
    },
    isActive: {
        type: DataTypes.TINYINT,
        allowNull: false
    },
    createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    updatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    deletedBy: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    deletedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
},
{
    tableName: 'sp_announcements',
    timestamps: true,
    paranoid: true,
    deletedAt: "deletedAt"
});
module.exports = Announcement;
