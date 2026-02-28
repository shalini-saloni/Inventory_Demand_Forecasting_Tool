const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { registerUser, loginUser } = require('../controllers/authController');
const { validateRequest } = require('../middleware/validateMiddleware');

// Validation rules
const signupValidation = [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
];

const loginValidation = [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
];

// Routes
router.post('/signup', signupValidation, validateRequest, registerUser);
router.post('/login', loginValidation, validateRequest, loginUser);

module.exports = router;
