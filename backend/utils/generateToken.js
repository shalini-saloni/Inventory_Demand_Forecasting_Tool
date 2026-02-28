const jwt = require('jsonwebtoken');

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET || 'fallback_secret_for_dev', {
        expiresIn: '30d',
    });
};

module.exports = generateToken;
