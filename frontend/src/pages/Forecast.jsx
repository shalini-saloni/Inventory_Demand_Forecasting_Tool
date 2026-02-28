import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, ReferenceLine,
    Area, ComposedChart, Legend
} from 'recharts';
import { RefreshCcw, AlertCircle, Calendar, Activity, TrendingUp, ChevronDown } from 'lucide-react';

const PISTA = '#7ec062';
const BEIGE = '#b8894a';
const DARK  = '#2d3a2e';
const MUTED = '#9db89e';

const MetricChip = ({ label, value, icon: Icon, iconColor }) => (
    <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-2">
            <Icon size={16} style={{ color: iconColor || PISTA }} />
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: MUTED }}>{label}</span>
        </div>
        <p className="text-xl font-bold" style={{ color: DARK }}>{value}</p>
    </div>
);

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const fmt = (v) => v != null ? Math.round(v) : '—';
    return (
        <div style={{ background: 'rgba(45,58,46,0.96)', borderRadius: 10, padding: '10px 14px', minWidth: 170, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
            <p style={{ fontSize: 11, color: MUTED, marginBottom: 8, fontWeight: 600 }}>
                {new Date(label).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
            {payload.map(p => p.value != null && (
                <p key={p.dataKey} style={{ fontSize: 13, color: p.color || '#fff', margin: '3px 0' }}>
                    {p.name}: <strong>{fmt(p.value)}</strong>
                </p>
            ))}
        </div>
    );
};

const Forecast = () => {
    const [skus,         setSkus]         = useState([]);
    const [selectedSku,  setSelectedSku]  = useState('');
    const [chartData,    setChartData]    = useState([]);
    const [summaryRow,   setSummaryRow]   = useState(null);
    const [loading,      setLoading]      = useState(false);
    const [skuLoading,   setSkuLoading]   = useState(true);
    const [error,        setError]        = useState('');

    // Load distinct SKUs from the flat skus collection
    useEffect(() => {
        api.get('/api/skus')
            .then(res => {
                const list = Array.isArray(res.data) ? res.data : [];
                setSkus(list);
                if (list.length > 0) setSelectedSku(list[0].sku_id);
            })
            .catch(err => console.error('Failed to fetch SKUs', err))
            .finally(() => setSkuLoading(false));
    }, []);

    useEffect(() => {
        if (selectedSku) fetchForecast(selectedSku);
    }, [selectedSku]);

    const fetchForecast = async (skuId) => {
        setLoading(true); setError('');
        try {
            const res = await api.get(`/api/skus?sku_id=${encodeURIComponent(skuId)}`);
            const rows = Array.isArray(res.data) ? res.data : [];

            const summary = rows.find(r => r.type === 'forecast_summary') || null;
            setSummaryRow(summary);

            // Build chart data from historical + forecast rows only
            const chart = rows
                .filter(r => r.type === 'historical' || r.type === 'forecast')
                .map(r => ({
                    date:        r.date,
                    historical:  r.type === 'historical' ? (r.units_sold ?? null) : null,
                    forecast:    r.type === 'forecast'   ? (r.expected   ?? null) : null,
                    lower:       r.type === 'forecast'   ? (r.lower_bound ?? null) : null,
                    upper:       r.type === 'forecast'   ? (r.upper_bound ?? null) : null,
                }))
                .sort((a, b) => new Date(a.date) - new Date(b.date));

            setChartData(chart);
        } catch (err) {
            if (err.response?.status === 404) {
                setError(`No data found for "${skuId}". Make sure it was included in your CSV upload.`);
                setChartData([]); setSummaryRow(null);
            } else {
                setError('Failed to fetch forecast data.');
            }
        } finally {
            setLoading(false);
        }
    };

    const historicalCount = chartData.filter(d => d.historical != null).length;
    const forecastCount   = chartData.filter(d => d.forecast   != null).length;
    const splitDate       = chartData.find(d => d.forecast != null)?.date ?? null;

    return (
        <div className="space-y-5 animate-fade-in">
            {/* Header + SKU Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold mb-1" style={{ color: DARK }}>Demand Forecasting</h1>
                    <p className="text-sm" style={{ color: MUTED }}>Visualize historical sales vs ML predictions with confidence intervals.</p>
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
                                    ? <option>No SKUs found — upload CSV first</option>
                                    : skus.map(s => <option key={s.sku_id} value={s.sku_id}>{s.sku_id}</option>)
                            }
                        </select>
                        <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: MUTED, pointerEvents: 'none' }} />
                    </div>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricChip label="Total Predicted Demand" value={summaryRow ? summaryRow.total_predicted_demand?.toLocaleString() ?? 'N/A' : '—'} icon={TrendingUp} />
                <MetricChip label="Historical Days"  value={historicalCount ? `${historicalCount} days` : '—'} icon={Calendar}  iconColor={BEIGE} />
                <MetricChip label="Forecast Days"    value={forecastCount   ? `${forecastCount} days`   : '—'} icon={Activity}  iconColor="#6ab0d4" />
            </div>

            {/* Error state */}
            {error && (
                <div className="glass-card p-6 flex items-start gap-3 text-sm"
                    style={{ borderColor: 'rgba(252,165,165,0.4)', background: 'rgba(254,202,202,0.2)' }}>
                    <AlertCircle size={18} style={{ color: '#dc2626', flexShrink: 0, marginTop: 1 }} />
                    <p style={{ color: '#991b1b' }}>{error}</p>
                </div>
            )}

            {/* Chart */}
            {!error && (
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3 className="text-base font-bold" style={{ color: DARK }}>Demand Curve & Confidence Intervals</h3>
                            <p className="text-xs" style={{ color: MUTED }}>Dashed line = ML forecast · Shaded band = 95% confidence interval</p>
                        </div>
                        <div className="flex items-center gap-4 text-xs" style={{ color: MUTED }}>
                            <span className="flex items-center gap-1.5"><span style={{ width: 20, height: 2.5, background: '#9db89e', display: 'inline-block', borderRadius: 2 }}></span>Historical</span>
                            <span className="flex items-center gap-1.5"><span style={{ width: 20, height: 2.5, background: PISTA, display: 'inline-block', borderRadius: 2, borderTop: `2px dashed ${PISTA}` }}></span>Forecast</span>
                            <span className="flex items-center gap-1.5"><span style={{ width: 14, height: 10, background: 'rgba(126,192,98,0.2)', display: 'inline-block', borderRadius: 2 }}></span>95% CI</span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-72">
                            <div className="w-8 h-8 border-2 rounded-xl animate-spin"
                                style={{ borderColor: 'rgba(168,214,143,0.2)', borderTopColor: PISTA }}></div>
                        </div>
                    ) : chartData.length === 0 ? (
                        <div className="flex items-center justify-center h-72 text-sm" style={{ color: MUTED }}>
                            No chart data available for this SKU.
                        </div>
                    ) : (
                        <div style={{ height: 380 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
                                    <defs>
                                        <linearGradient id="ciGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%"   stopColor={PISTA} stopOpacity={0.2} />
                                            <stop offset="100%" stopColor={PISTA} stopOpacity={0.04} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(168,214,143,0.2)" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false} tickLine={false}
                                        tick={{ fill: MUTED, fontSize: 11 }} dy={8}
                                        minTickGap={28}
                                        tickFormatter={v => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: MUTED, fontSize: 11 }} dx={-4} />
                                    <Tooltip content={<CustomTooltip />} />

                                    {/* 95% CI shaded band */}
                                    <Area type="monotone" dataKey="upper" stroke="none" fill="url(#ciGrad)"
                                        name="Upper CI" legendType="none" activeDot={false} />
                                    <Area type="monotone" dataKey="lower" stroke="none"
                                        fill="rgba(253,250,245,0.9)" name="Lower CI" legendType="none" activeDot={false} />

                                    {/* Historical line */}
                                    <Line type="monotone" dataKey="historical" stroke="#9db89e" strokeWidth={2.5}
                                        dot={{ r: 2.5, fill: '#9db89e', strokeWidth: 0 }}
                                        activeDot={{ r: 6, fill: '#7a9a7b', strokeWidth: 0 }}
                                        connectNulls={false} name="Historical" />

                                    {/* Forecast line */}
                                    <Line type="monotone" dataKey="forecast" stroke={PISTA} strokeWidth={2.5}
                                        strokeDasharray="6 4"
                                        dot={{ r: 2.5, fill: PISTA, strokeWidth: 0 }}
                                        activeDot={{ r: 6, fill: '#5ba63e', strokeWidth: 0 }}
                                        connectNulls={false} name="Forecast" />

                                    {/* Split reference line */}
                                    {splitDate && (
                                        <ReferenceLine x={splitDate} stroke="rgba(168,214,143,0.6)"
                                            strokeDasharray="4 3"
                                            label={{ value: 'Forecast Start', position: 'top', fill: MUTED, fontSize: 11 }} />
                                    )}
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            )}

            {/* Summary details card */}
            {summaryRow && (
                <div className="glass-card p-5">
                    <h3 className="text-sm font-bold mb-4" style={{ color: DARK }}>Forecast Summary — {selectedSku}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        {[
                            ['Total Predicted Demand', summaryRow.total_predicted_demand?.toLocaleString() ?? '—'],
                            ['Safety Stock',           summaryRow.safety_stock  ?? '—'],
                            ['Reorder Point',          summaryRow.reorder_point ?? '—'],
                        ].map(([label, value]) => (
                            <div key={label} className="p-3 rounded-xl" style={{ background: 'rgba(168,214,143,0.08)', border: '1px solid rgba(168,214,143,0.2)' }}>
                                <p className="text-xs mb-1" style={{ color: MUTED }}>{label}</p>
                                <p className="text-lg font-bold" style={{ color: DARK }}>{value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Forecast;
