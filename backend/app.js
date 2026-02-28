const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./middleware/errorMiddleware');
const { requestLogger } = require('./middleware/loggerMiddleware');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/skus', require('./routes/skus')); // Legacy fallback if needed
app.use('/api/items', require('./routes/itemRoutes'));
app.use('/api/forecast', require('./routes/forecastRoutes'));
app.use('/api/restock', require('./routes/restockRoutes'));

// Basic Route
app.get('/', (req, res) => {
    res.send('Invenza Production API is running!');
});

// Error Middleware
app.use(errorHandler);

// Initialize Cron Jobs
const { initCronJobs } = require('./jobs/forecastCron');
if (process.env.NODE_ENV !== 'test') { // Prevent crons from hanging jest tests
    initCronJobs();
}

module.exports = app;
