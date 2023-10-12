const Register = require('../models/register');
const Sound = require('../models/sound')
const { Op } = require('sequelize');
class RegisterRepository {
    static async getById(id) {
        try {
            const register = await Register.findByPk(id);
            return register;
        } catch (error) {
            throw error;
        }
    }
    static async getAll() {
        try {
            const registers = await Register.findAll();
            return registers;
        } catch (error) {
            throw error;
        }
    }
    static async getAllForDriver() {
        try {
            const registers = await Register.findAll({
                attributes: { exclude: ['state', 'id'] },
                where: {

                    state: true,
                    week: {
                        [Op.ne]: [0, 0, 0, 0, 0, 0, 0]
                    }

                },
                include: [{
                    model: Sound,
                    attributes: ['name']
                }]
            });
            return registers;
        } catch (error) {
            throw error;
        }
    }
    static async add(data) {
        try {
            const register = await Register.create(data);
            return register;
        } catch (error) {
            throw error;
        }
    }
    static async edit(id, data) {
        try {
            await Register.update(data, {
                where: { id: id }
            })
            const register = await this.getById(id);
            return register;
        } catch (error) {
            throw error;
        }
    }
    static async delete(id) {
        try {
            const register = await Register.destroy({
                where: { id: id }
            });
            return register;
        } catch (error) {
            throw error;
        }
    }
}
module.exports = RegisterRepository