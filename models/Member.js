
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Member = sequelize.define('Member', {
    fname: {
        type: DataTypes.STRING,
        allowNull: true
    },
    member_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    mname: {
        type: DataTypes.STRING,
        allowNull: true
    },
    lname: {
        type: DataTypes.STRING,
        allowNull: true
    },
    address: {
        type: DataTypes.STRING,
        allowNull: true
    },
    dob: {
        type: DataTypes.STRING,
        allowNull: true
    },
    doy: {
        type: DataTypes.STRING,
        allowNull: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true
    },
    mobile_no: {
        type: DataTypes.STRING,
        allowNull: true
    },
    home_no: {
        type: DataTypes.STRING,
        allowNull: true
    },
    native_place: {
        type: DataTypes.STRING,
        allowNull: true
    },
    real_surname: {
        type: DataTypes.STRING,
        allowNull: true
    },
    is_marketing: {
        type: DataTypes.CHAR,
        allowNull: true
    },
    is_newsletter: {
        type: DataTypes.CHAR,
        allowNull: true
    },
    postal_code: {
        type: DataTypes.STRING,
        allowNull: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: true
    },
    family_member: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    relation: {
        type: DataTypes.STRING,
        allowNull: true
    },
    added_by: {
        type: DataTypes.STRING,
        allowNull: true
    },
    random_str: {
        type: DataTypes.STRING,
        allowNull: true
    },
    is_active: {
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
    datetime: {
        type: DataTypes.STRING,
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
    tableName: 'sp_members',
    timestamps: true,
    paranoid: true,
    deletedAt: "deletedAt"
});
// A member can have a parent member
Member.belongsTo(Member, { as: "parent", foreignKey: "member_id" });

// Optionally, a member can have many children
Member.hasMany(Member, { as: "children", foreignKey: "member_id" });

module.exports = Member;
