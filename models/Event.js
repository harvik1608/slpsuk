
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Event = sequelize.define('Event', {
    name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    date: {
        type: DataTypes.STRING,
        allowNull: true
    },
    time: {
        type: DataTypes.STRING,
        allowNull: true
    },
    venue: {
        type: DataTypes.STRING,
        allowNull: true
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true
    },
    background_image: {
        type: DataTypes.STRING,
        allowNull: true
    },
    contact_person: {
        type: DataTypes.TEXT("long"),
        allowNull: true
    },
    galleries: {
        type: DataTypes.TEXT("long"),
        allowNull: true
    },
    notification_sent: {
        type: DataTypes.CHAR,
        allowNull: true
    },
    display: {
        type: DataTypes.CHAR,
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
    tableName: 'sp_events',
    timestamps: true,
    paranoid: true,
    deletedAt: "deletedAt"
});

module.exports = Event;
