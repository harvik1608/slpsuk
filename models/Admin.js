
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Admin = sequelize.define('Admin', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    mobile_no: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    code: {
        type: DataTypes.STRING,
        allowNull: true
    },
    role: {
        type: DataTypes.STRING,
        allowNull: true
    },
    permission: {
        type: DataTypes.TEXT("long"),
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
    }
},
{
    tableName: 'sp_admins',
    timestamps: true,
    paranoid: true,
    deletedAt: "deletedAt"
});
module.exports = Admin;
