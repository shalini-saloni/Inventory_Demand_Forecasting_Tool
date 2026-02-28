const { generateRestockRecommendation } = require('../services/inventoryService');
const Restock = require('../models/Restock');

// @desc    Generate a new restock recommendation based on latest forecast
// @route   POST /api/restock/:itemId
// @access  Private (Manager/Admin)
const createRestockRecommendation = async (req, res, next) => {
    try {
        const recommendation = await generateRestockRecommendation(req.params.itemId);
        res.status(201).json(recommendation);
    } catch (err) {
        next(err);
    }
};

// @desc    Get latest restock recommendation
// @route   GET /api/restock/:itemId
// @access  Private
const getRestockRecommendation = async (req, res, next) => {
    try {
        const recommendation = await Restock.findOne({ item: req.params.itemId }).sort({ createdAt: -1 });
        if (!recommendation) {
            return res.status(404).json({ message: 'No restocking data found for this item' });
        }
        res.status(200).json(recommendation);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createRestockRecommendation,
    getRestockRecommendation
};
