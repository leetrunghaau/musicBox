const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'data/database.db', 
});
sequelize.sync()
  .then(() => {
    console.log('Cơ sở dữ liệu đã được đồng bộ hóa');
  })
  .catch((error) => {
    console.error('Lỗi khi đồng bộ hóa cơ sở dữ liệu:', error);
  });
module.exports = sequelize;