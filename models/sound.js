const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Sound = sequelize.define('Sound', {
    
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    tableName: 'sound',
    timestamps: false
});

module.exports = Sound;
