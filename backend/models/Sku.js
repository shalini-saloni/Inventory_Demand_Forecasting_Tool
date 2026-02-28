/**
 * backend/models/Sku.js  ──  FIXED
 *
 * BUG: strict: true silently dropped reorder_alert, recommended_order_qty,
 *      days_of_stock that the fixed skus.js route now saves.
 *      Mongoose with strict:true does NOT throw — it just ignores unknown fields.
 *
 * FIX: All new summary fields added explicitly. strict changed to false as safety net.
 */
const mongoose = require('mongoose');

const SkuSchema = new mongoose.Schema(
    {
        sku_id: { type: String, required: true, index: true },
        type: {
            type: String, required: true,
            enum: ['historical', 'forecast', 'forecast_summary'],
        },

        date: { type: String, default: null },  // "YYYY-MM-DD" string

        // ── historical rows ───────────────────────────────────────────────────
        units_sold: { type: Number, default: null },

        // ── forecast rows ─────────────────────────────────────────────────────
        expected:    { type: Number, default: null },
        lower_bound: { type: Number, default: null },
        upper_bound: { type: Number, default: null },

        // ── forecast_summary rows (original) ──────────────────────────────────
        total_predicted_demand: { type: Number, default: null },
        safety_stock:           { type: Number, default: null },
        reorder_point:          { type: Number, default: null },

        // ── forecast_summary rows (NEW — were silently dropped with strict:true) ─
        reorder_alert:         { type: Boolean, default: null },
        recommended_order_qty: { type: Number,  default: null },
        days_of_stock:         { type: Number,  default: null },

        last_updated: { type: Date, default: Date.now },
    },
    {
        strict:     false,   // ← FIXED: was true; stops extra fields being dropped
        timestamps: false,
        collection: 'skus',
    }
);

SkuSchema.index({ sku_id: 1, type: 1 });

module.exports = mongoose.model('Sku', SkuSchema);