import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { ShoppingCart, AlertTriangle, ShieldCheck, RefreshCcw, PackageSearch, ArrowRight } from 'lucide-react';

const StatBox = ({ label, value, subtext, alert }) => (
    <div className={`p-5 rounded-xl border ${alert ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
        <p className={`text-sm font-medium mb-1 ${alert ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>{label}</p>
        <h3 className={`text-3xl font-bold ${alert ? 'text-red-700 dark:text-red-300' : 'text-slate-900 dark:text-white'}`}>{value}</h3>
        {subtext && <p className={`text-xs mt-2 ${alert ? 'text-red-500' : 'text-slate-400'}`}>{subtext}</p>}
    </div>
);

const Restock = () => {
    const [skus, setSkus] = useState([]);
    const [selectedSku, setSelectedSku] = useState('');
    const [restockData, setRestockData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSkus = async () => {
            try {
                const res = await api.get('/api/items');
                setSkus(res.data);
                if (res.data.length > 0) {
                    setSelectedSku(res.data[0]._id || res.data[0].sku);
                }
            } catch (err) {
                console.error('Failed to fetch SKUs', err);
            }
        };
        fetchSkus();
    }, []);

    useEffect(() => {
        if (selectedSku) {
            fetchRestockData(selectedSku);
        }
    }, [selectedSku]);

    const fetchRestockData = async (itemId) => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get(`/api/restock/${itemId}`);
            setRestockData(res.data);
        } catch (err) {
            if (err.response?.status === 404) {
                setRestockData(null);
                setError('No restock recommendation found for this item. Please generate one.');
            } else {
                setError('Failed to fetch restocking data.');
            }
        } finally {
            setLoading(false);
        }
    };

    const generateRecommendation = async () => {
        if (!selectedSku) return;
        setGenerating(true);
        setError('');
        try {
            const res = await api.post(`/api/restock/${selectedSku}`);
            setRestockData(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to generate recommendation.');
        } finally {
            setGenerating(false);
        }
    };

    const selectedItem = skus.find(s => (s._id || s.sku) === selectedSku);

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-1">Restock Recommendations</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Actionable procurement advice based on predicted demand and lead times.</p>
                </div>

                <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Select Item:</label>
                    <div className="relative min-w-[200px]">
                        <select
                            value={selectedSku}
                            onChange={(e) => setSelectedSku(e.target.value)}
                            className="w-full appearance-none pl-4 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                        >
                            {skus.map(sku => (
                                <option key={sku._id || sku.sku} value={sku._id || sku.sku}>
                                    {sku.sku} - {sku.name}
                                </option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                </div>
            </div>

            {loading && !generating && (
                <div className="flex items-center justify-center h-64 glass-card">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            )}

            {error && !restockData && !loading && (
                <div className="glass-card p-8 flex flex-col items-center justify-center text-center">
                    <div className="p-4 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full mb-4">
                        <AlertTriangle size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{error}</h3>
                    <button
                        onClick={generateRecommendation}
                        disabled={generating}
                        className="mt-4 flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-all disabled:opacity-50"
                    >
                        {generating ? <RefreshCcw className="animate-spin" size={18} /> : <ShoppingCart size={18} />}
                        {generating ? 'Processing...' : 'Run Restock Engine'}
                    </button>
                </div>
            )}

            {!loading && restockData && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Alert Card */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className={`glass-card p-6 overflow-hidden relative ${restockData.reorder_alert
                                ? 'ring-2 ring-red-500 dark:ring-red-500/50'
                                : 'ring-2 ring-emerald-500 dark:ring-emerald-500/50'
                            }`}
                        >
                            {/* Decorative background glow */}
                            <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none ${restockData.reorder_alert ? 'bg-red-500' : 'bg-emerald-500'}`}></div>

                            <div className="flex items-start gap-4 mb-6 relative z-10">
                                <div className={`p-4 rounded-full ${restockData.reorder_alert ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400'}`}>
                                    {restockData.reorder_alert ? <AlertTriangle size={32} /> : <ShieldCheck size={32} />}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {restockData.reorder_alert ? 'CRITICAL REORDER REQUIRED' : 'STOCK LEVELS OPTIMAL'}
                                    </h2>
                                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                                        {restockData.reorder_alert
                                            ? `Current stock cannot sustain demand for the upcoming ${selectedItem?.leadTimeDays || 7}-day lead time.`
                                            : `Current inventory is sufficient to cover forecasted demand during lead time.`}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 relative z-10">
                                <StatBox
                                    label="Recommended Order Qty"
                                    value={restockData.recommended_order_qty > 0 ? restockData.recommended_order_qty : '0'}
                                    subtext={`Buffer applied: ${((restockData.safety_factor || 1.2) - 1) * 100}%`}
                                    alert={restockData.reorder_alert}
                                />
                                <StatBox
                                    label="Days of Stock Remaining"
                                    value={restockData.days_of_stock_remaining ?? 'N/A'}
                                    subtext={restockData.days_of_stock_remaining < (selectedItem?.leadTimeDays || 7) ? "Stockouts imminent" : "Safe levels"}
                                    alert={restockData.days_of_stock_remaining < (selectedItem?.leadTimeDays || 7)}
                                />
                            </div>

                            {restockData.reorder_alert && (
                                <div className="mt-8 relative z-10">
                                    <button className="w-full flex justify-center items-center gap-2 py-3.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all hover:-translate-y-0.5">
                                        Create Purchase Order
                                        <ArrowRight size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Details Sidebar */}
                    <div className="space-y-6">
                        <div className="glass-card p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <PackageSearch size={20} className="text-blue-500" />
                                <h3 className="font-bold text-slate-900 dark:text-white">Analysis Details</h3>
                            </div>

                            <ul className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
                                <li className="pt-2 flex justify-between items-center text-sm">
                                    <span className="text-slate-500 dark:text-slate-400">Current Stock</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">{restockData.current_stock || 0} units</span>
                                </li>
                                <li className="pt-3 flex justify-between items-center text-sm">
                                    <span className="text-slate-500 dark:text-slate-400">Lead Time</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">{selectedItem?.leadTimeDays || restockData.lead_time_days || 7} days</span>
                                </li>
                                <li className="pt-3 flex justify-between items-center text-sm">
                                    <span className="text-slate-500 dark:text-slate-400">Demand During Lead Time</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">{restockData.forecasted_demand_lead_time?.toFixed(0) || 0} units</span>
                                </li>
                                <li className="pt-3 flex justify-between items-center text-sm">
                                    <span className="text-slate-500 dark:text-slate-400">Safety Buffer Multiplier</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">x{restockData.safety_factor || 1.2}</span>
                                </li>
                            </ul>

                            <button
                                onClick={generateRecommendation}
                                disabled={generating}
                                className="mt-6 w-full flex justify-center items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-colors disabled:opacity-50 text-sm"
                            >
                                <RefreshCcw className={generating ? 'animate-spin' : ''} size={16} />
                                Refresh Analysis
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Restock;
