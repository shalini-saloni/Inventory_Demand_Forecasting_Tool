const Item = require('../models/Item');

// @desc    Get all items
// @route   GET /api/items
// @access  Private
const getItems = async (req, res, next) => {
    try {
        const items = await Item.find({});
        res.status(200).json(items);
    } catch (err) {
        next(err);
    }
};

// @desc    Create a new item
// @route   POST /api/items
// @access  Private (Admin/Manager)
const createItem = async (req, res, next) => {
    try {
        const { name, sku, basePrice, category, leadTimeDays } = req.body;

        const itemExists = await Item.findOne({ sku });
        if (itemExists) {
            res.status(400);
            throw new Error('Item with this SKU already exists');
        }

        const item = await Item.create({
            name,
            sku,
            basePrice,
            category,
            leadTimeDays
        });

        res.status(201).json(item);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getItems,
    createItem
};
