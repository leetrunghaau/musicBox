const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Sound = require('./sound')

const Register = sequelize.define('Register', {

    id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    sound:{
        type: DataTypes.STRING
    },
    time: {
        type: DataTypes.STRING,
        
    },
    state: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    week:{
        type: DataTypes.JSON
    }
}, {
    tableName: 'register',
    timestamps: false
});
Register.belongsTo(Sound,{foreignKey:'sound', targetKey:'id', onDelete: 'CASCADE', onUpdate: 'CASCADE'})
module.exports = Register;