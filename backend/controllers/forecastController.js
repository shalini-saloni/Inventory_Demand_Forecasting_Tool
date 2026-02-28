const { generateForecast, getLatestForecast } = require('../services/forecastService');

// @desc    Trigger Python engine to generate new forecast for item
// @route   POST /api/forecast/:itemId
// @access  Private
const createForecast = async (req, res, next) => {
    try {
        const forecast = await generateForecast(req.params.itemId);
        res.status(201).json(forecast);
    } catch (err) {
        next(err);
    }
};

// @desc    Get latest historical forecast for item
// @route   GET /api/forecast/:itemId
// @access  Private
const getForecast = async (req, res, next) => {
    try {
        const forecast = await getLatestForecast(req.params.itemId);
        res.status(200).json(forecast);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createForecast,
    getForecast
};
