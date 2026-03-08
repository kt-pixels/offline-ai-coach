const jwt = require('jsonwebtoken');

function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'dev-secret-change-me', {
    expiresIn: '7d'
  });
}

module.exports = generateToken;
