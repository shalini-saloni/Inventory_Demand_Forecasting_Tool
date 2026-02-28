const Forecast = require('../models/Forecast');
const Sales = require('../models/Sales');
const { runPythonForecast } = require('./pythonService');

/**
 * Generate a new forecast for a specific item
 * @param {String} itemId 
 */
const generateForecast = async (itemId) => {
    // 1. Fetch historical sales data from DB
    const salesHistory = await Sales.find({ item: itemId }).sort({ date: 1 });

    // 2. Pass data to the Python Forecasting Engine
    const pythonResult = await runPythonForecast(itemId, salesHistory);

    // 3. Save the result to MongoDB
    const forecast = await Forecast.create({
        item: itemId,
        method: pythonResult.method,
        horizonDays: pythonResult.horizonDays,
        forecastArray: pythonResult.forecastArray,
        metrics: pythonResult.metrics
    });

    return forecast;
};

/**
 * Fetch the latest forecast for an item from the DB
 */
const getLatestForecast = async (itemId) => {
    const forecast = await Forecast.findOne({ item: itemId }).sort({ createdAt: -1 });
    if (!forecast) {
        throw new Error('No forecast found for this item');
    }
    return forecast;
};

module.exports = {
    generateForecast,
    getLatestForecast
};
