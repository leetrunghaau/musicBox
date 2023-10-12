const crypto = require('crypto')

const generateId = () => {
  const randomBytes = crypto.randomBytes(5).toString('hex');
  const shortenedId = randomBytes.substring(0, 10);
  return shortenedId;
};

module.exports = {
  generateId
}