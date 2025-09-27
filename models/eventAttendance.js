
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Event = require('../models/Event');
const Member = require('../models/Member');

const eventAttendance = sequelize.define('eventAttendance', {
    eventId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    memberId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    members: {
        type: DataTypes.INTEGER,
        allowNull: true
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
    tableName: 'sp_event_attendances',
    timestamps: true,
    paranoid: true,
    deletedAt: "deletedAt"
});
eventAttendance.belongsTo(Event, {
    foreignKey: 'eventId',
    as: 'event'
});

// EventAttendance belongs to Member
eventAttendance.belongsTo(Member, {
    foreignKey: 'memberId',
    as: 'member'
});
module.exports = eventAttendance;
