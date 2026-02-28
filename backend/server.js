const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

const { errorHandler } = require('./middleware/errorMiddleware');

// Routes
app.use('/api/skus', require('./routes/skus'));

// Basic Route
app.get('/', (req, res) => {
    res.send('Invenza Backend API is running!');
});

// Error Middleware
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});
