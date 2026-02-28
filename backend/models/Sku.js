const mongoose = require('mongoose');

const SkuSchema = new mongoose.Schema({
    sku_id: { type: String, required: true, unique: true },
    historical_sales: [
        {
            date: { type: String, required: true },
            units_sold: { type: Number, required: true }
        }
    ],
    forecast: {
        predicted_demand: [
            {
                date: { type: String, required: true },
                expected: { type: Number, required: true },
                lower_bound: { type: Number, required: true },
                upper_bound: { type: Number, required: true }
            }
        ],
        total_predicted_demand: { type: Number, default: 0 },
        safety_stock: { type: Number, default: 0 },
        reorder_point: { type: Number, default: 0 }
    },
    last_updated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Sku', SkuSchema);
