const authService = require('../services/authService');

// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Public
const registerUser = async (req, res, next) => {
    try {
        const result = await authService.registerUser(req.body);
        res.status(201).json(result);
    } catch (err) {
        if (err.message === 'User already exists') {
            res.status(400).json({ success: false, message: err.message });
            return;
        }
        res.status(500).json({ success: false, message: err.message || 'Registration failed' });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
    try {
        const result = await authService.loginUser(req.body);
        res.status(200).json(result);
    } catch (err) {
        if (err.message === 'Invalid email or password') {
            res.status(401).json({ success: false, message: err.message });
            return;
        }
        res.status(500).json({ success: false, message: err.message || 'Login failed' });
    }
};

module.exports = {
    registerUser,
    loginUser,
};
