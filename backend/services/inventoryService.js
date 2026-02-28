const Restock = require('../models/Restock');
const { getLatestForecast } = require('./forecastService');
const Item = require('../models/Item');

/**
 * Calculate basic static replenishment metrics based on the latest forecast.
 * Mocking a statistical formula (Safety Stock = Z-score * std_dev * sqrt(lead_time))
 * Since this is a demo, we are doing a simpler derivative calc based on predicted demand.
 */
const generateRestockRecommendation = async (itemId) => {
    const forecast = await getLatestForecast(itemId);
    const item = await Item.findById(itemId);

    if (!item) throw new Error('Item not found');

    // Sum up expected demand over the horizon
    const totalPredictedDemand = forecast.forecastArray.reduce((acc, curr) => acc + curr.expected, 0);

    // Fake Safety Stock Calculation: 20% buffer over lead time demand
    const dailyDemandRate = totalPredictedDemand / forecast.horizonDays;
    const leadTimeDemand = dailyDemandRate * item.leadTimeDays;
    const safetyStock = Math.ceil(leadTimeDemand * 0.2);

    // Reorder Point = Lead Time Demand + Safety Stock
    const reorderPoint = Math.ceil(leadTimeDemand + safetyStock);

    // Fictional current inventory mock (Normally would be stored in Item or separate Inventory model)
    const currentFictionalInventory = Math.floor(Math.random() * 200);
    const alertActive = currentFictionalInventory <= reorderPoint;

    // Recommended Order Qty = Reorder Point - Current Inventory (If alert active)
    let recommendedOrderQuantity = 0;
    if (alertActive) {
        recommendedOrderQuantity = Math.ceil(reorderPoint - currentFictionalInventory + safetyStock); // Order up to a nice buffer
    }

    const restockMetrics = await Restock.create({
        item: itemId,
        forecast: forecast._id,
        totalPredictedDemand,
        safetyStock,
        reorderPoint,
        alertActive,
        recommendedOrderQuantity
    });

    return restockMetrics;
};

module.exports = { generateRestockRecommendation };
