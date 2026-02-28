const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    sku: {
        type: String,
        required: true,
        unique: true
    },
    category: {
        type: String,
        default: 'General'
    },
    basePrice: {
        type: Number,
        required: true
    },
    leadTimeDays: {
        type: Number,
        required: true,
        default: 7
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Item', ItemSchema);
