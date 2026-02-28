import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import {
    Package, AlertTriangle, TrendingUp, Activity,
    RefreshCcw, Database, Zap, ArrowUpRight
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const PISTA = '#7ec062';
const BEIGE = '#b8894a';
const DARK  = '#2d3a2e';
const MUTED = '#9db89e';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: 'rgba(45,58,46,0.96)', borderRadius: 10, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
            <p style={{ fontSize: 11, color: MUTED, marginBottom: 6, fontWeight: 600 }}>{label}</p>
            {payload.map(p => (
                <p key={p.dataKey} style={{ fontSize: 13, color: p.fill || '#fff', margin: '2px 0' }}>
                    {p.name}: <strong>{p.value?.toLocaleString()}</strong>
                </p>
            ))}
        </div>
    );
};

const StatCard = ({ title, value, subtitle, icon: Icon, iconBg, accent }) => (
    <div className="stat-card">
        <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-xl" style={{ background: iconBg || 'rgba(168,214,143,0.18)' }}>
                <Icon size={20} style={{ color: accent || PISTA }} />
            </div>
        </div>
        <h3 className="text-2xl font-bold mb-0.5" style={{ color: DARK }}>{value}</h3>
        <p className="text-sm font-medium mb-0.5" style={{ color: '#4a6a4b' }}>{title}</p>
        {subtitle && <p className="text-xs" style={{ color: MUTED }}>{subtitle}</p>}
    </div>
);

const Dashboard = () => {
    const [summary,    setSummary]  = useState(null);
    const [loading,    setLoading]  = useState(true);
    const [error,      setError]    = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchSummary = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true);
        setError(null);
        try {
            const res = await api.get('/api/skus/summary');
            setSummary({
                total_global_demand: res.data?.total_global_demand ?? 0,
                total_skus:          res.data?.total_skus          ?? 0,
                items:               Array.isArray(res.data?.items) ? res.data.items : [],
            });
        } catch (err) {
            console.error('Dashboard error:', err);
            setError('Could not reach backend. Is your server running on port 8000?');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchSummary(); }, []);

    // Chart data: demand per SKU sorted descending, top 12
    const chartData = React.useMemo(() => {
        if (!summary?.items?.length) return [];
        return [...summary.items]
            .sort((a, b) => (b.total_predicted_demand ?? 0) - (a.total_predicted_demand ?? 0))
            .slice(0, 12)
            .map(item => ({
                sku:    item.sku_id?.replace('SKU-', '') ?? '?',
                demand: item.total_predicted_demand ?? 0,
                safety: item.safety_stock           ?? 0,
            }));
    }, [summary]);

    const alertCount = summary?.items?.filter(i => (i.reorder_point ?? 0) > (i.safety_stock ?? 0)).length ?? 0;
    const hasData    = (summary?.total_skus ?? 0) > 0 && (summary?.total_global_demand ?? 0) > 0;

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="w-10 h-10 rounded-xl animate-spin border-2"
                style={{ borderColor: 'rgba(168,214,143,0.2)', borderTopColor: PISTA }}></div>
            <p className="text-sm" style={{ color: MUTED }}>Loading dashboard…</p>
        </div>
    );

    // ── Error ────────────────────────────────────────────────────────────────
    if (error) return (
        <div className="space-y-4 animate-fade-in">
            <div className="p-4 rounded-xl flex items-start gap-3 text-sm"
                style={{ background: 'rgba(254,202,202,0.3)', border: '1px solid rgba(252,165,165,0.4)', color: '#991b1b' }}>
                <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{error}</span>
            </div>
            <button onClick={() => fetchSummary()} className="btn-primary">Retry</button>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold mb-1" style={{ color: DARK }}>Overview</h1>
                    <p className="text-sm" style={{ color: MUTED }}>
                        {hasData
                            ? `${summary.total_skus} SKUs tracked · ${summary.total_global_demand.toLocaleString()} units forecasted total`
                            : summary?.total_skus > 0
                                ? `${summary.total_skus} SKU rows in DB but no forecast summaries found yet — re-upload your CSV`
                                : 'Upload CSV data to populate this dashboard.'}
                    </p>
                </div>
                <button onClick={() => fetchSummary(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium"
                    style={{ background: 'rgba(168,214,143,0.15)', color: '#3d7a28', border: '1px solid rgba(168,214,143,0.3)' }}>
                    <RefreshCcw size={15} className={refreshing ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Tracked SKUs"       value={(summary?.total_skus ?? 0).toLocaleString()}           subtitle="With forecast data"       icon={Package}       />
                <StatCard title="Forecasted Demand"  value={(summary?.total_global_demand ?? 0).toLocaleString()}  subtitle="Total predicted units"    icon={TrendingUp}    />
                <StatCard title="Reorder Alerts"     value={alertCount.toLocaleString()}                           subtitle="Items needing attention"  icon={AlertTriangle} iconBg="rgba(232,146,74,0.12)" accent="#e8924a" />
                <StatCard title="ML Engine"          value="Online"                                                subtitle="Holt-Winters ready"       icon={Activity}      />
            </div>

            {/* No data prompt */}
            {!hasData && (
                <div className="glass-card p-10 flex flex-col items-center text-center gap-4">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                        style={{ background: 'rgba(168,214,143,0.12)' }}>
                        <Database size={28} style={{ color: PISTA }} />
                    </div>
                    <div>
                        <h3 className="text-base font-bold mb-1" style={{ color: DARK }}>
                            {summary?.total_skus > 0 ? 'Incomplete Data' : 'No Data Yet'}
                        </h3>
                        <p className="text-sm max-w-sm" style={{ color: MUTED }}>
                            {summary?.total_skus > 0
                                ? `Found ${summary.total_skus} SKU rows but no forecast_summary rows. Make sure your CSV includes forecast_summary rows.`
                                : 'Upload your CSV to populate the dashboard with real forecast data.'}
                        </p>
                    </div>
                    <a href="/upload" className="btn-primary">Go to Upload →</a>
                </div>
            )}

            {/* Chart + Activity */}
            {hasData && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Bar chart */}
                    <div className="lg:col-span-2 glass-card p-6">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="text-base font-bold" style={{ color: DARK }}>Predicted Demand by SKU</h3>
                                <p className="text-xs" style={{ color: MUTED }}>Total forecasted units — top {Math.min(chartData.length, 12)}</p>
                            </div>
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                                style={{ background: 'rgba(168,214,143,0.12)', color: '#3d7a28' }}>
                                <Zap size={11} /> Live
                            </div>
                        </div>
                        <div style={{ height: 260 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }} barSize={18}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(168,214,143,0.2)" />
                                    <XAxis dataKey="sku" axisLine={false} tickLine={false}
                                        tick={{ fill: MUTED, fontSize: 11 }} dy={6} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: MUTED, fontSize: 11 }} dx={-4} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(168,214,143,0.08)' }} />
                                    <Bar dataKey="demand" name="Predicted Demand" radius={[6,6,0,0]}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`}
                                                fill={index % 2 === 0 ? PISTA : '#a8d68f'}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Activity log */}
                    <div className="glass-card p-6">
                        <h3 className="text-base font-bold mb-0.5" style={{ color: DARK }}>Activity Log</h3>
                        <p className="text-xs mb-4" style={{ color: MUTED }}>System events</p>
                        {[
                            { title: 'CSV data synced to MongoDB',              type: 'success' },
                            { title: `${summary.total_skus} SKUs in database`,  type: 'info'    },
                            { title: `${alertCount} items flagged for reorder`, type: alertCount > 0 ? 'warning' : 'success' },
                            { title: 'Forecast summaries available',             type: 'success' },
                            { title: 'ML engine: Holt-Winters active',           type: 'info'    },
                        ].map((a, i) => {
                            const dotColor = a.type === 'warning' ? '#e8924a' : a.type === 'success' ? PISTA : '#6ab0d4';
                            return (
                                <div key={i} className="flex items-start gap-3 py-3"
                                    style={{ borderBottom: i < 4 ? '1px solid rgba(168,214,143,0.12)' : 'none' }}>
                                    <div className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0" style={{ background: dotColor }}></div>
                                    <p className="text-sm" style={{ color: DARK }}>{a.title}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Full summary table */}
            {hasData && summary.items.length > 0 && (
                <div className="glass-card overflow-hidden">
                    <div className="px-6 py-4 border-b flex items-center justify-between"
                        style={{ borderColor: 'rgba(168,214,143,0.2)' }}>
                        <h3 className="text-base font-bold" style={{ color: DARK }}>All SKU Summaries</h3>
                        <span className="badge-green">{summary.items.length} SKUs</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr style={{ background: 'rgba(168,214,143,0.06)', borderBottom: '1px solid rgba(168,214,143,0.2)' }}>
                                    {['SKU ID','Predicted Demand','Safety Stock','Reorder Point','Status'].map((h,i) => (
                                        <th key={h} className={`px-5 py-3 text-xs font-bold uppercase tracking-wide ${i>0?'text-right':''}`}
                                            style={{ color: MUTED }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {[...summary.items]
                                    .sort((a, b) => (b.total_predicted_demand ?? 0) - (a.total_predicted_demand ?? 0))
                                    .map((item, i) => {
                                        const isAlert = (item.reorder_point ?? 0) > (item.safety_stock ?? 0);
                                        return (
                                            <tr key={i} style={{ borderBottom: '1px solid rgba(168,214,143,0.1)' }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(168,214,143,0.04)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                <td className="px-5 py-3.5 font-semibold" style={{ color: DARK }}>{item.sku_id}</td>
                                                <td className="px-5 py-3.5 text-right font-bold" style={{ color: '#3d7a28' }}>
                                                    {(item.total_predicted_demand ?? 0).toLocaleString()}
                                                </td>
                                                <td className="px-5 py-3.5 text-right" style={{ color: '#5a6b5b' }}>{item.safety_stock ?? '—'}</td>
                                                <td className="px-5 py-3.5 text-right" style={{ color: '#5a6b5b' }}>{item.reorder_point ?? '—'}</td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <span style={{
                                                        display:'inline-flex', alignItems:'center',
                                                        padding:'0.15rem 0.65rem', borderRadius:999,
                                                        fontSize:'0.72rem', fontWeight:700,
                                                        background: isAlert ? 'rgba(254,202,202,0.35)' : 'rgba(168,214,143,0.25)',
                                                        color: isAlert ? '#991b1b' : '#2d5a1e',
                                                    }}>
                                                        {isAlert ? '⚠ Reorder' : '✓ OK'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
