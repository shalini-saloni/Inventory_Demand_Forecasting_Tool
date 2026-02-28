const mongoose = require('mongoose');

const ForecastSchema = new mongoose.Schema({
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true
    },
    method: {
        type: String,
        enum: ['Holt-Winters', 'Moving-Average', 'ARIMA', 'Prophet'],
        required: true
    },
    horizonDays: {
        type: Number,
        required: true,
        default: 30
    },
    forecastArray: [
        {
            date: { type: Date, required: true },
            expected: { type: Number, required: true },
            lower_bound: { type: Number, required: true },
            upper_bound: { type: Number, required: true }
        }
    ],
    metrics: {
        MAE: { type: Number },
        RMSE: { type: Number },
        MAPE: { type: Number }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Forecast', ForecastSchema);
