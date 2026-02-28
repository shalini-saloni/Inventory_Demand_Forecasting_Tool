const express = require('express');
const router = express.Router();
const { createForecast, getForecast } = require('../controllers/forecastController');
const { protect } = require('../middleware/authMiddleware');

router.route('/:itemId')
    .post(protect, createForecast)
    .get(protect, getForecast);

module.exports = router;
