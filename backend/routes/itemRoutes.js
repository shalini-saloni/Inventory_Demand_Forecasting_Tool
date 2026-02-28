/**
 * backend/routes/itemRoutes.js  ──  FIXED
 * Added DELETE /:id and PUT /:id (were missing → 404 on delete/edit)
 */
const express = require('express');
const router  = express.Router();
const { getItems, createItem, deleteItem, updateItem } = require('../controllers/itemController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect,  getItems)
    .post(protect, createItem);

// ✅ ADDED
router.route('/:id')
    .put(protect,    updateItem)
    .delete(protect, deleteItem);

module.exports = router;