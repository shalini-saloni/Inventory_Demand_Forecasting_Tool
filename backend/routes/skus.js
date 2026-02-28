/**
 * backend/routes/skus.js  ──  COMPLETE FIX
 * ============================================================
 *
 * WHY NOTHING WAS WORKING:
 * ─────────────────────────
 * Your CSV (retail_sales_2023_small.csv) has columns:
 *   date, store_id, item_id, sales
 *
 * The old bulk route expected:
 *   sku_id, type, date, units_sold, expected, lower_bound, upper_bound ...
 *
 * So every upload either:
 *  (a) failed the sku_id check → 0 rows saved, OR
 *  (b) saved 22 raw historical rows with NO forecast_summary rows ever created
 *
 * Dashboard reads forecast_summary rows → finds 0 → "Incomplete Data"
 * Restock reads forecast_summary rows  → finds 0 → "No forecast summary found"
 * Forecast chart has no forecast rows  → shows 1 dot
 *
 * ABOUT YOUR PYTHON FILES:
 * ─────────────────────────
 * app.py / forecasting_engine.py / data_cleaner.py are a STANDALONE CLI tool.
 * They generate charts and CSVs to disk. They do NOT talk to Node.js at all.
 * This Node.js route replaces that Python logic for the web app.
 *
 * THE FIX:
 * ─────────
 * This route now:
 * 1. Auto-detects your CSV format (item_id+sales OR sku_id+units_sold)
 * 2. Runs full Holt-Winters Triple Exponential Smoothing (mirrors forecasting_engine.py)
 * 3. Saves ALL 3 row types: historical + forecast (30 days) + forecast_summary
 * 4. Dashboard, Forecast, Restock all instantly populate after one upload
 */

const express = require('express');
const router  = express.Router();
const Sku     = require('../models/Sku');
const { protect } = require('../middleware/authMiddleware');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/skus/summary  →  Dashboard stat cards
// ─────────────────────────────────────────────────────────────────────────────
router.get('/summary', protect, async (req, res, next) => {
    try {
        const summaries = await Sku.find({ type: 'forecast_summary' }).lean();
        const total_global_demand = summaries.reduce(
            (s, r) => s + (r.total_predicted_demand || 0), 0
        );
        const allSkuIds = await Sku.distinct('sku_id', { sku_id: { $ne: null } });
        return res.json({
            total_global_demand: Math.round(total_global_demand),
            total_skus:          allSkuIds.length,
            items:               summaries,
        });
    } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/skus          →  distinct SKU list (for Forecast/Restock dropdowns)
// GET /api/skus?sku_id=X →  all rows for that SKU (historical + forecast + summary)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', protect, async (req, res, next) => {
    try {
        const { sku_id } = req.query;
        if (sku_id) {
            const rows = await Sku.find({ sku_id }).sort({ date: 1 }).lean();
            if (!rows.length)
                return res.status(404).json({ message: `SKU "${sku_id}" not found` });
            return res.json(rows);
        }
        const ids = await Sku.distinct('sku_id', { sku_id: { $ne: null } });
        return res.json(ids.map(id => ({ sku_id: id })));
    } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/skus/bulk  ←  UPLOAD + FORECAST PIPELINE
//
// ACCEPTS (auto-detected):
//   Format A: retail_sales_2023_small.csv  →  date, store_id, item_id, sales
//   Format B: pre-typed CSV               →  sku_id, type, date, units_sold
//
// PRODUCES in MongoDB per SKU:
//   • N   historical    rows  (units_sold, date)
//   • 30  forecast      rows  (expected, lower_bound, upper_bound, date)
//   • 1   forecast_summary    (total_predicted_demand, safety_stock,
//                              reorder_point, reorder_alert, recommended_order_qty)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/bulk', protect, async (req, res, next) => {
    try {
        const { skus } = req.body;

        if (!skus || !Array.isArray(skus) || skus.length === 0)
            return res.status(400).json({
                message: 'Expected { skus: [ ...rows ] } with at least 1 row.'
            });

        // ── 1. Detect format & normalise ──────────────────────────────────────
        const firstRow   = skus[0];
        const colsLower  = Object.keys(firstRow).map(k => k.toLowerCase().trim());

        // Helper: get value by multiple possible column names (case-insensitive)
        const get = (row, ...names) => {
            for (const n of names) {
                const key = Object.keys(row).find(
                    k => k.toLowerCase().trim() === n
                );
                if (key !== undefined && row[key] !== '' && row[key] != null)
                    return row[key];
            }
            return null;
        };

        // Determine if this is a pre-typed CSV (has explicit 'type' column)
        const isPreTyped = colsLower.includes('type');

        // Validate required columns
        const hasIdCol   = colsLower.includes('item_id') || colsLower.includes('sku_id');
        const hasSaleCol = colsLower.includes('sales')   || colsLower.includes('units_sold');
        const hasDateCol = colsLower.includes('date');

        if (!hasIdCol || !hasDateCol) {
            return res.status(400).json({
                message: `CSV must have a date column and an ID column (item_id or sku_id). ` +
                         `Detected columns: ${colsLower.join(', ')}`,
            });
        }

        // ── 2. Extract historical rows ────────────────────────────────────────
        let historicalRows = [];

        if (isPreTyped) {
            // Format B: only take rows with type='historical'
            historicalRows = skus
                .filter(r => String(get(r, 'type') || '').trim().toLowerCase() === 'historical')
                .map(r => ({
                    sku_id:     String(get(r, 'sku_id', 'item_id') || '').trim(),
                    date:       String(get(r, 'date') || '').trim(),
                    units_sold: parseFloat(get(r, 'units_sold', 'sales') || 0),
                }));
        } else {
            // Format A: ALL rows are historical sales
            if (!hasSaleCol) {
                return res.status(400).json({
                    message: `CSV must have a sales/units_sold column. ` +
                             `Detected: ${colsLower.join(', ')}`,
                });
            }
            historicalRows = skus.map(r => ({
                sku_id:     String(get(r, 'item_id', 'sku_id') || '').trim(),
                date:       String(get(r, 'date') || '').trim(),
                units_sold: parseFloat(get(r, 'sales', 'units_sold') || 0),
            }));
        }

        // Filter out bad rows
        historicalRows = historicalRows.filter(
            r => r.sku_id && r.date && !isNaN(r.units_sold)
        );

        if (historicalRows.length === 0) {
            return res.status(400).json({
                message: 'No valid rows found after parsing. ' +
                         `Detected columns: ${colsLower.join(', ')}. ` +
                         'Expected: date + (item_id or sku_id) + (sales or units_sold).',
            });
        }

        const skuIds = [...new Set(historicalRows.map(r => r.sku_id))];
        console.log(`[bulk] Detected ${historicalRows.length} historical rows for ${skuIds.length} SKUs: ${skuIds.join(', ')}`);

        // ── 3. Wipe existing data for these SKUs ──────────────────────────────
        await Sku.deleteMany({ sku_id: { $in: skuIds } });

        // ── 4. Save historical docs ───────────────────────────────────────────
        const historicalDocs = historicalRows.map(r => ({
            sku_id:       r.sku_id,
            type:         'historical',
            date:         r.date,
            units_sold:   r.units_sold,
            last_updated: new Date(),
        }));
        await Sku.insertMany(historicalDocs, { ordered: false });
        console.log(`[bulk] Saved ${historicalDocs.length} historical docs`);

        // ── 5. Run Holt-Winters per SKU, save forecast + summary ──────────────
        const HORIZON       = 30;
        const CURRENT_STOCK = 300;   // default; swap with real inventory model later
        const LEAD_TIME     = 7;
        const SAFETY_FACTOR = 1.2;

        const forecastDocs = [];
        const summaryDocs  = [];

        for (const skuId of skuIds) {
            // Get this SKU's historical rows sorted by date
            const rows = historicalRows
                .filter(r => r.sku_id === skuId)
                .sort((a, b) => new Date(a.date) - new Date(b.date));

            if (rows.length < 3) {
                console.warn(`[bulk] Skipping ${skuId}: only ${rows.length} rows (need ≥ 3)`);
                continue;
            }

            const sales    = rows.map(r => r.units_sold);
            const lastDate = new Date(rows[rows.length - 1].date);

            // Run Holt-Winters
            const hw = holtwinters(sales, 7, HORIZON);

            // Build 30 forecast docs
            for (let i = 0; i < HORIZON; i++) {
                const fd = new Date(lastDate);
                fd.setDate(fd.getDate() + i + 1);

                const exp   = Math.max(0, hw.forecast[i]);
                const ci    = 1.96 * hw.sigma;
                forecastDocs.push({
                    sku_id:       skuId,
                    type:         'forecast',
                    date:         fd.toISOString().split('T')[0],
                    expected:     +exp.toFixed(2),
                    lower_bound:  +Math.max(0, exp - ci).toFixed(2),
                    upper_bound:  +(exp + ci).toFixed(2),
                    last_updated: new Date(),
                });
            }

            // Build 1 forecast_summary doc (mirrors restocking_recommendation() in forecasting_engine.py)
            const totalDemand = hw.forecast.reduce((s, v) => s + Math.max(0, v), 0);
            const dailyAvg    = totalDemand / HORIZON;
            const leadDemand  = hw.forecast.slice(0, LEAD_TIME)
                .reduce((s, v) => s + Math.max(0, v), 0);
            const safetyStock = Math.ceil(leadDemand * 0.2);
            const reorderPt   = Math.ceil(leadDemand + safetyStock);
            const daysOfStock = CURRENT_STOCK / (dailyAvg + 1e-9);
            const alert       = daysOfStock < LEAD_TIME;
            const orderQty    = Math.max(
                0,
                Math.ceil(totalDemand * SAFETY_FACTOR - CURRENT_STOCK)
            );

            summaryDocs.push({
                sku_id:                  skuId,
                type:                    'forecast_summary',
                total_predicted_demand:  Math.round(totalDemand),
                safety_stock:            Math.round(safetyStock),
                reorder_point:           Math.round(reorderPt),
                reorder_alert:           alert,
                recommended_order_qty:   Math.round(orderQty),
                days_of_stock:           +daysOfStock.toFixed(1),
                last_updated:            new Date(),
            });

            console.log(
                `[bulk] ${skuId}: demand=${Math.round(totalDemand)} ` +
                `daysStock=${daysOfStock.toFixed(1)} alert=${alert} order=${Math.round(orderQty)}`
            );
        }

        // Save forecast rows
        if (forecastDocs.length > 0) {
            await Sku.insertMany(forecastDocs, { ordered: false });
            console.log(`[bulk] Saved ${forecastDocs.length} forecast docs`);
        }

        // Save summary rows  ← THIS IS WHAT WAS ALWAYS MISSING
        if (summaryDocs.length > 0) {
            await Sku.insertMany(summaryDocs, { ordered: false });
            console.log(`[bulk] Saved ${summaryDocs.length} forecast_summary docs`);
        }

        const totalSaved = historicalDocs.length + forecastDocs.length + summaryDocs.length;

        return res.status(200).json({
            message:
                `✅ Upload & forecast complete! ` +
                `${historicalDocs.length} historical + ${forecastDocs.length} forecast ` +
                `+ ${summaryDocs.length} summaries saved.`,
            insertedCount:  totalSaved,
            skuCount:       skuIds.length,
            historicalRows: historicalDocs.length,
            forecastPoints: forecastDocs.length,
            summaries:      summaryDocs.length,
        });

    } catch (err) {
        console.error('[skus/bulk] ERROR:', err.message);
        next(err);
    }
});

// Single-row insert kept for compatibility
router.post('/', protect, async (req, res, next) => {
    try {
        const sku = new Sku({ ...req.body, last_updated: Date.now() });
        await sku.save();
        res.status(201).json(sku);
    } catch (err) { next(err); }
});

// =============================================================================
//  HOLT-WINTERS ADDITIVE FORECASTING  (mirrors forecasting_engine.py)
//
//  Python version uses: statsmodels ExponentialSmoothing(trend='add', seasonal='add')
//  This JS version implements the same additive model manually.
//
//  params: alpha=0.3 (level), beta=0.1 (trend), gamma=0.2 (seasonal)
//  seasonal_period = 7 (weekly, same as SEASONAL_PERIOD in app.py)
// =============================================================================
function holtwinters(data, period, horizon) {
    const n = data.length;

    // Fallback: not enough data for full seasonal model → use simple mean
    if (n < 2 * period) {
        const avg = data.reduce((s, v) => s + v, 0) / n;
        const sig = stdDev(data);
        return {
            forecast: Array(horizon).fill(avg),
            sigma:    sig,
        };
    }

    const alpha = 0.3;  // level smoothing
    const beta  = 0.1;  // trend smoothing
    const gamma = 0.2;  // seasonal smoothing

    // ── Initialise level, trend, seasonal indices ─────────────────────────────
    const nPeriods = Math.floor(n / period);

    // Initial level = average of first period
    let level = data.slice(0, period).reduce((s, v) => s + v, 0) / period;

    // Initial trend = average of period-over-period differences
    let trend = 0;
    for (let i = 0; i < period; i++) {
        trend += (data[i + period] - data[i]) / period;
    }
    trend /= period;

    // Initial seasonal = average ratio of each position to its period average
    const periodAvgs = [];
    for (let p = 0; p < nPeriods; p++) {
        const slice = data.slice(p * period, (p + 1) * period);
        periodAvgs.push(slice.reduce((s, v) => s + v, 0) / period);
    }
    const seasonal = new Array(period).fill(0);
    for (let i = 0; i < period; i++) {
        let sum = 0;
        for (let p = 0; p < nPeriods; p++) {
            sum += data[p * period + i] / (periodAvgs[p] || 1);
        }
        seasonal[i] = sum / nPeriods;
    }

    // ── Smooth through historical data ────────────────────────────────────────
    const fitted = [];
    for (let t = 0; t < n; t++) {
        const si = t % period;

        if (t === 0) {
            fitted.push(level + trend + seasonal[si]);
            continue;
        }

        const prevLevel = level;
        const prevTrend = trend;

        level       = alpha * (data[t] - seasonal[si]) + (1 - alpha) * (prevLevel + prevTrend);
        trend       = beta  * (level - prevLevel)       + (1 - beta)  * prevTrend;
        seasonal[si]= gamma * (data[t] - level)         + (1 - gamma) * seasonal[si];

        fitted.push(level + trend + seasonal[si]);
    }

    // ── Generate forecast ─────────────────────────────────────────────────────
    const forecast = [];
    for (let h = 1; h <= horizon; h++) {
        const si = (n + h - 1) % period;
        forecast.push(level + h * trend + seasonal[si]);
    }

    // ── Compute sigma from residuals (for 95% CI) ─────────────────────────────
    const residuals = data.map((v, i) => v - fitted[i]);
    const sigma     = stdDev(residuals);

    return { forecast, sigma };
}

function stdDev(arr) {
    if (!arr || arr.length === 0) return 0;
    const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
    const variance = arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length;
    return Math.sqrt(variance);
}

module.exports = router;