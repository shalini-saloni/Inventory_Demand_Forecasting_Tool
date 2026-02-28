const cron = require('node-cron');
const Item = require('../models/Item');
const { generateForecast } = require('../services/forecastService');
const { generateRestockRecommendation } = require('../services/inventoryService');

/**
 * Initialize all scheduled background jobs
 */
const initCronJobs = () => {
    // Run every day at midnight server time (0 0 * * *)
    cron.schedule('0 0 * * *', async () => {
        console.log('--- CRON: Starting daily forecast generation ---');
        try {
            const items = await Item.find({});

            for (const item of items) {
                try {
                    // Generate new forecast for the item
                    await generateForecast(item._id);

                    // Generate updated restocking recommendations
                    await generateRestockRecommendation(item._id);

                    console.log(`CRON: Successfully updated forecast & restock limits for item: ${item.sku}`);
                } catch (itemErr) {
                    console.error(`CRON: Failed to update item ${item.sku} - ${itemErr.message}`);
                }
            }

            console.log('--- CRON: Daily forecast generation complete ---');
        } catch (err) {
            console.error('CRON: Critical failure in scheduled job: ', err);
        }
    });

    console.log('Cron jobs initialized: Daily forecasts scheduled for 00:00');
};

module.exports = { initCronJobs };
