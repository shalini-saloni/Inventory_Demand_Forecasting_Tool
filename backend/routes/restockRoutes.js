const express = require('express');
const router = express.Router();
const { createRestockRecommendation, getRestockRecommendation } = require('../controllers/restockController');
const { protect } = require('../middleware/authMiddleware');

router.route('/:itemId')
    .post(protect, createRestockRecommendation)
    .get(protect, getRestockRecommendation);

module.exports = router;
