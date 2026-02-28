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
app.use('/api/skus', require('./routes/skus'));

// Basic Route
app.get('/', (req, res) => {
    res.send('Invenza Production API is running!');
});

// Error Middleware
app.use(errorHandler);

module.exports = app;
