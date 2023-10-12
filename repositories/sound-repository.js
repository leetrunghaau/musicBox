const Sound = require('../models/sound');

class SoundRepository {
   static async getById(id) {
        try {
            const sound = await Sound.findByPk(id);
            return sound;
        } catch (error) {
            throw error;
        }
    }

    static async getAll() {
        try {
            const sounds = await Sound.findAll();
            return sounds;
        } catch (error) {
            throw error;
        }
    }

    static async add(soundData) {
        try {
            const newSound = await Sound.create(soundData);
            return newSound;
        } catch (error) {
            throw error;
        }
    }

    static async edit(id, data) {
        try {
            await Sound.update(data, {
                where: { id: id }
            });
            const updatedSound = await this.getById(id);
            return updatedSound;
        } catch (error) {
            throw error;
        }
    }

    static async delete(id) {
        try {
            const deletedCount = await Sound.destroy({
                where: { id: id }
            });
            return deletedCount;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = SoundRepository;
