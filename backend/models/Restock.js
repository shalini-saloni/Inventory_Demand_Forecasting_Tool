const mongoose = require('mongoose');

const RestockSchema = new mongoose.Schema({
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true
    },
    forecast: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Forecast',
        required: true
    },
    totalPredictedDemand: {
        type: Number,
        required: true
    },
    safetyStock: {
        type: Number,
        required: true
    },
    reorderPoint: {
        type: Number,
        required: true
    },
    alertActive: {
        type: Boolean,
        default: false
    },
    recommendedOrderQuantity: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Restock', RestockSchema);
