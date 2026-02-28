const connectDB = require('./config/db');
require('dotenv').config();

const app = require('./app');
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV || 'development'} on port: ${PORT}`);
});
