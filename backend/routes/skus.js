const express = require('express');
const router = express.Router();
const Sku = require('../models/Sku');

// @route   GET /api/skus
// @desc    Get all SKUs (or a specific one if query param provided)
router.get('/', async (req, res) => {
    try {
        const { sku_id } = req.query;

        if (sku_id) {
            const sku = await Sku.findOne({ sku_id });
            if (!sku) return res.status(404).json({ message: 'SKU not found' });
            return res.json(sku);
        }

        const skus = await Sku.find().select('sku_id forecast.total_predicted_demand last_updated');
        res.json(skus);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/skus/bulk
// @desc    Bulk Upload/Update multiple SKUs from Python ML Pipeline
router.post('/bulk', async (req, res, next) => {
    try {
        const { skus } = req.body;
        if (!skus || !Array.isArray(skus)) {
            return res.status(400).json({ message: 'Invalid data format. Expected an array of SKUs.' });
        }
        // TODO: Implement bulk database insertion logic in Step 7
        res.status(200).json({ message: 'Bulk route reached', count: skus.length });
    } catch (err) {
        next(err);
    }
});

// @route   POST /api/skus
// @desc    Add or Update a SKU and its forecast data
router.post('/', async (req, res) => {
    try {
        const { sku_id, historical_sales, forecast } = req.body;

        // Check if SKU exists, if so update it, otherwise create new
        let sku = await Sku.findOne({ sku_id });

        if (sku) {
            sku.historical_sales = historical_sales;
            sku.forecast = forecast;
            sku.last_updated = Date.now();
            await sku.save();
            return res.json({ message: 'SKU updated successfully', sku });
        }

        sku = new Sku({
            sku_id,
            historical_sales,
            forecast
        });

        await sku.save();
        res.status(201).json({ message: 'SKU created successfully', sku });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
