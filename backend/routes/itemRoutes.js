const express = require('express');
const router = express.Router();
const { getItems, createItem } = require('../controllers/itemController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getItems)
    .post(protect, createItem);

module.exports = router;
