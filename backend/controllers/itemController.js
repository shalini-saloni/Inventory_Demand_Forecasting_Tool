/**
 * backend/controllers/itemController.js  ──  FIXED
 *
 * ADDED: deleteItem and updateItem (both were missing — caused DELETE/PUT 404s)
 */
const Item = require('../models/Item');

const getItems = async (req, res, next) => {
    try {
        const items = await Item.find({});
        res.status(200).json(items);
    } catch (err) { next(err); }
};

const createItem = async (req, res, next) => {
    try {
        const { name, sku, basePrice, category, leadTimeDays } = req.body;
        const exists = await Item.findOne({ sku });
        if (exists) { res.status(400); throw new Error('Item with this SKU already exists'); }
        const item = await Item.create({ name, sku, basePrice, category, leadTimeDays });
        res.status(201).json(item);
    } catch (err) { next(err); }
};

// ✅ ADDED — was completely missing; caused "Delete this item?" window.confirm popup to do nothing
const deleteItem = async (req, res, next) => {
    try {
        const item = await Item.findByIdAndDelete(req.params.id);
        if (!item) { res.status(404); throw new Error('Item not found'); }
        res.status(200).json({ success: true, message: 'Item deleted successfully', id: req.params.id });
    } catch (err) { next(err); }
};

// ✅ ADDED — edit support
const updateItem = async (req, res, next) => {
    try {
        const { name, sku, basePrice, category, leadTimeDays } = req.body;
        const item = await Item.findByIdAndUpdate(
            req.params.id,
            { name, sku, basePrice, category, leadTimeDays },
            { new: true, runValidators: true }
        );
        if (!item) { res.status(404); throw new Error('Item not found'); }
        res.status(200).json(item);
    } catch (err) { next(err); }
};

module.exports = { getItems, createItem, deleteItem, updateItem };