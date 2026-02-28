import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
    ShoppingCart, AlertTriangle, ShieldCheck,
    RefreshCcw, ChevronDown, TrendingDown, Package
} from 'lucide-react';

const PISTA = '#7ec062';
const DARK  = '#2d3a2e';
const MUTED = '#9db89e';

const MetricBox = ({ label, value, unit, alert }) => (
    <div className="p-5 rounded-xl" style={{
        background: alert ? 'rgba(254,202,202,0.2)' : 'rgba(168,214,143,0.08)',
        border: `1px solid ${alert ? 'rgba(252,165,165,0.4)' : 'rgba(168,214,143,0.25)'}`,
    }}>
        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: alert ? '#dc2626' : MUTED }}>{label}</p>
        <p className="text-3xl font-bold" style={{ color: alert ? '#991b1b' : DARK }}>{value}</p>
        {unit && <p className="text-xs mt-1" style={{ color: MUTED }}>{unit}</p>}
    </div>
);

const Restock = () => {
    const [skus,        setSkus]       = useState([]);
    const [selectedSku, setSelectedSku] = useState('');
    const [skuData,     setSkuData]    = useState(null);   // the forecast_summary row
    const [loading,     setLoading]    = useState(false);
    const [skuLoading,  setSkuLoading] = useState(true);
    const [error,       setError]      = useState('');

    // Load SKUs from the flat skus collection (NOT /api/items)
    useEffect(() => {
        api.get('/api/skus')
            .then(res => {
                const list = Array.isArray(res.data) ? res.data : [];
                setSkus(list);
                if (list.length > 0) setSelectedSku(list[0].sku_id);
            })
            .catch(() => setError('Failed to load SKU list.'))
            .finally(() => setSkuLoading(false));
    }, []);

    useEffect(() => {
        if (selectedSku) fetchRestockData(selectedSku);
    }, [selectedSku]);

    const fetchRestockData = async (skuId) => {
        setLoading(true); setError('');
        try {
            const res = await api.get(`/api/skus?sku_id=${encodeURIComponent(skuId)}`);
            const rows = Array.isArray(res.data) ? res.data : [];
            const summary = rows.find(r => r.type === 'forecast_summary');
            if (!summary) {
                setSkuData(null);
                setError(`No forecast summary found for "${skuId}". Make sure your CSV includes a forecast_summary row.`);
            } else {
                setSkuData(summary);
            }
        } catch (err) {
            setError(err.response?.status === 404
                ? `No data found for "${skuId}".`
                : 'Failed to fetch restock data.');
        } finally {
            setLoading(false);
        }
    };

    // Derive reorder alert: if reorder_point > safety_stock we need to restock
    const needsReorder    = skuData ? (skuData.reorder_point ?? 0) > (skuData.safety_stock ?? 0) : false;
    const recommendedQty  = skuData ? Math.max(0, (skuData.reorder_point ?? 0) - (skuData.safety_stock ?? 0)) : 0;

    return (
        <div className="space-y-5 animate-fade-in max-w-4xl">
            {/* Header + SKU Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold mb-1" style={{ color: DARK }}>Restock Recommendations</h1>
                    <p className="text-sm" style={{ color: MUTED }}>Procurement advice based on ML forecast and lead time analysis.</p>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium whitespace-nowrap" style={{ color: '#4a6a4b' }}>Item:</label>
                    <div className="relative">
                        <select
                            value={selectedSku}
                            onChange={e => setSelectedSku(e.target.value)}
                            disabled={skuLoading}
                            style={{
                                appearance: 'none', padding: '0.55rem 2.5rem 0.55rem 0.875rem',
                                border: '1.5px solid rgba(168,214,143,0.5)', borderRadius: 10,
                                background: 'rgba(253,250,245,0.95)', color: DARK,
                                fontSize: 14, fontWeight: 600, minWidth: 160, outline: 'none',
                            }}
                        >
                            {skuLoading
                                ? <option>Loading…</option>
                                : skus.length === 0
                                    ? <option>No SKUs — upload CSV first</option>
                                    : skus.map(s => <option key={s.sku_id} value={s.sku_id}>{s.sku_id}</option>)
                            }
                        </select>
                        <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: MUTED, pointerEvents: 'none' }} />
                    </div>
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center h-48">
                    <div className="w-8 h-8 border-2 rounded-xl animate-spin"
                        style={{ borderColor: 'rgba(168,214,143,0.2)', borderTopColor: PISTA }}></div>
                </div>
            )}

            {/* Error */}
            {!loading && error && (
                <div className="glass-card p-6 flex items-start gap-3 text-sm"
                    style={{ background: 'rgba(254,202,202,0.2)', borderColor: 'rgba(252,165,165,0.4)' }}>
                    <AlertTriangle size={18} style={{ color: '#dc2626', flexShrink: 0, marginTop: 1 }} />
                    <p style={{ color: '#991b1b' }}>{error}</p>
                </div>
            )}

            {/* Main content */}
            {!loading && skuData && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Left — Alert card */}
                    <div className="lg:col-span-2 glass-card p-6 relative overflow-hidden">
                        {/* Background glow */}
                        <div style={{
                            position: 'absolute', top: -60, right: -60,
                            width: 180, height: 180, borderRadius: '50%',
                            background: needsReorder ? 'rgba(239,68,68,0.12)' : 'rgba(126,192,98,0.12)',
                            filter: 'blur(40px)', pointerEvents: 'none',
                        }} />

                        {/* Status banner */}
                        <div className="flex items-start gap-4 mb-6 relative z-10">
                            <div className="p-3.5 rounded-2xl flex-shrink-0" style={{
                                background: needsReorder ? 'rgba(254,202,202,0.4)' : 'rgba(168,214,143,0.25)',
                            }}>
                                {needsReorder
                                    ? <AlertTriangle size={28} style={{ color: '#dc2626' }} />
                                    : <ShieldCheck   size={28} style={{ color: PISTA }} />
                                }
                            </div>
                            <div>
                                <h2 className="text-xl font-bold mb-1" style={{ color: DARK }}>
                                    {needsReorder ? '⚠ Critical Reorder Required' : '✓ Stock Levels Optimal'}
                                </h2>
                                <p className="text-sm" style={{ color: MUTED }}>
                                    {needsReorder
                                        ? `Reorder point (${skuData.reorder_point}) exceeds safety stock (${skuData.safety_stock}). Order now to avoid stockout.`
                                        : `Safety stock covers predicted demand. No immediate action required.`}
                                </p>
                            </div>
                        </div>

                        {/* Metric boxes */}
                        <div className="grid grid-cols-2 gap-4 relative z-10">
                            <MetricBox
                                label="Recommended Order Qty"
                                value={recommendedQty.toLocaleString()}
                                unit="units to order"
                                alert={needsReorder}
                            />
                            <MetricBox
                                label="Total Predicted Demand"
                                value={(skuData.total_predicted_demand ?? 0).toLocaleString()}
                                unit="forecasted units"
                                alert={false}
                            />
                        </div>

                        {/* CTA Button */}
                        {needsReorder && (
                            <button className="mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white relative z-10"
                                style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 4px 14px rgba(220,38,38,0.3)' }}>
                                <ShoppingCart size={18} />
                                Create Purchase Order
                            </button>
                        )}

                        {!needsReorder && (
                            <button
                                onClick={() => fetchRestockData(selectedSku)}
                                className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold relative z-10"
                                style={{ background: 'rgba(168,214,143,0.15)', border: '1px solid rgba(168,214,143,0.3)', color: '#3d7a28' }}>
                                <RefreshCcw size={15} />
                                Refresh Analysis
                            </button>
                        )}
                    </div>

                    {/* Right — Details sidebar */}
                    <div className="glass-card p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Package size={18} style={{ color: PISTA }} />
                            <h3 className="font-bold text-sm" style={{ color: DARK }}>Analysis Details</h3>
                        </div>
                        <div className="space-y-0">
                            {[
                                ['SKU ID',               selectedSku],
                                ['Safety Stock',         skuData.safety_stock  ?? '—'],
                                ['Reorder Point',        skuData.reorder_point ?? '—'],
                                ['Total Forecast Demand',skuData.total_predicted_demand ?? '—'],
                                ['Recommended Order',    recommendedQty + ' units'],
                                ['Status',               needsReorder ? '🔴 Reorder Now' : '🟢 OK'],
                            ].map(([label, value], i) => (
                                <div key={i} className="flex justify-between items-center py-3 text-sm"
                                    style={{ borderBottom: i < 5 ? '1px solid rgba(168,214,143,0.15)' : 'none' }}>
                                    <span style={{ color: MUTED }}>{label}</span>
                                    <span className="font-semibold text-right" style={{ color: DARK }}>{value}</span>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => fetchRestockData(selectedSku)}
                            className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold"
                            style={{ background: 'rgba(168,214,143,0.1)', border: '1px solid rgba(168,214,143,0.25)', color: '#4a7a30' }}>
                            <RefreshCcw size={13} />
                            Recalculate
                        </button>
                    </div>
                </div>
            )}

            {/* No SKU data empty state */}
            {!loading && !error && !skuData && !skuLoading && skus.length === 0 && (
                <div className="glass-card p-10 flex flex-col items-center text-center gap-3">
                    <TrendingDown size={32} style={{ color: MUTED }} />
                    <p className="font-semibold" style={{ color: DARK }}>No SKU data available</p>
                    <p className="text-sm" style={{ color: MUTED }}>Upload a CSV file with forecast data to see restock recommendations.</p>
                    <a href="/upload" className="btn-primary mt-2">Go to Upload →</a>
                </div>
            )}
        </div>
    );
};

export default Restock;
