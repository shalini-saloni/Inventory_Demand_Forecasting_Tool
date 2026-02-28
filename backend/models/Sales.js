const mongoose = require('mongoose');

const SalesSchema = new mongoose.Schema({
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    revenue: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('Sales', SalesSchema);
