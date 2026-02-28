const User = require('../models/User');
const generateToken = require('../utils/generateToken');

/**
 * Register a new user
 * @param {Object} userData - { name, email, password, role }
 * @returns {Object} user details and token
 */
const registerUser = async (userData) => {
    const { name, email, password, role } = userData;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        throw new Error('User already exists');
    }

    // Create user
    const user = await User.create({
        name,
        email,
        password,
        role
    });

    if (user) {
        return {
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user.id, user.role),
        };
    } else {
        throw new Error('Invalid user data');
    }
};

/**
 * Authenticate a user
 * @param {Object} credentials - { email, password }
 * @returns {Object} user details and token
 */
const loginUser = async (credentials) => {
    const { email, password } = credentials;

    // Check for user email and explicitly select password field
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
        return {
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user.id, user.role),
        };
    } else {
        throw new Error('Invalid email or password');
    }
};

module.exports = {
    registerUser,
    loginUser
};
