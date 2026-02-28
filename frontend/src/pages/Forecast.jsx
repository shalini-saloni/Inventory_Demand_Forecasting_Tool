import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { LineChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { RefreshCcw, AlertCircle, Calendar, LineChart as ChartIcon, Activity } from 'lucide-react';

const Forecast = () => {
    const [skus, setSkus] = useState([]);
    const [selectedSku, setSelectedSku] = useState('');
    const [forecastData, setForecastData] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSkus = async () => {
            try {
                const res = await api.get('/api/items');
                setSkus(res.data);
                if (res.data.length > 0) {
                    setSelectedSku(res.data[0]._id || res.data[0].sku); // Fallback to sku if _id is not used smoothly
                }
            } catch (err) {
                console.error('Failed to fetch SKUs', err);
            }
        };
        fetchSkus();
    }, []);

    useEffect(() => {
        if (selectedSku) {
            fetchForecast(selectedSku);
        }
    }, [selectedSku]);

    const formatChartData = (data) => {
        if (!data) return [];

        let formatted = [];

        // Handle variations in backend response structures
        if (data.historical_sales && data.forecast) {
            const { historical_sales, forecast } = data;

            historical_sales.forEach(point => {
                formatted.push({
                    date: point.date,
                    sales: point.quantity || point.sales,
                    forecast: null,
                    lowerBound: null,
                    upperBound: null
                });
            });

            // Check if forecast is an array of objects or an object of arrays
            if (Array.isArray(forecast)) {
                forecast.forEach(point => {
                    formatted.push({
                        date: point.date,
                        sales: null,
                        forecast: point.forecast,
                        lowerBound: point.lowerBound || (point.forecast * 0.9),
                        upperBound: point.upperBound || (point.forecast * 1.1)
                    });
                });
            } else if (forecast.dates && forecast.predictions) {
                forecast.dates.forEach((date, i) => {
                    formatted.push({
                        date,
                        sales: null,
                        forecast: forecast.predictions[i],
                        lowerBound: forecast.lower_bound ? forecast.lower_bound[i] : forecast.predictions[i] * 0.9,
                        upperBound: forecast.upper_bound ? forecast.upper_bound[i] : forecast.predictions[i] * 1.1
                    });
                });
            }
        }

        // Sort by date just in case
        formatted.sort((a, b) => new Date(a.date) - new Date(b.date));
        return formatted;
    };

    const fetchForecast = async (itemId) => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get(`/api/forecast/${itemId}`);
            setForecastData(res.data);
            setChartData(formatChartData(res.data));
        } catch (err) {
            if (err.response?.status === 404) {
                setForecastData(null);
                setChartData([]);
                setError('No forecast exists for this item yet. Generate one to view the predictions.');
            } else {
                setError('Failed to fetch forecast. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    };

    const generateForecast = async () => {
        if (!selectedSku) return;
        setGenerating(true);
        setError('');
        try {
            const res = await api.post(`/api/forecast/${selectedSku}`);
            setForecastData(res.data);
            setChartData(formatChartData(res.data));
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to generate forecast.');
        } finally {
            setGenerating(false);
        }
    };

    const firstForecastPoint = chartData.find(d => d.forecast !== null);
    const splitDate = firstForecastPoint ? firstForecastPoint.date : null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-1">Demand Forecasting</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Visualize actual sales vs ML predictions with confidence intervals.</p>
                </div>

                {/* SKU Selector */}
                <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Select Item:</label>
                    <div className="relative min-w-[200px]">
                        <select
                            value={selectedSku}
                            onChange={(e) => setSelectedSku(e.target.value)}
                            className="w-full appearance-none pl-4 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-shadow"
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

            {error && !forecastData && (
                <div className="glass-card p-8 flex flex-col items-center justify-center text-center">
                    <div className="p-4 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full mb-4">
                        <AlertCircle size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{error}</h3>
                    <button
                        onClick={generateForecast}
                        disabled={generating}
                        className="mt-4 flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-all disabled:opacity-50"
                    >
                        {generating ? <RefreshCcw className="animate-spin" size={18} /> : <ChartIcon size={18} />}
                        {generating ? 'Running ML Pipeline...' : 'Generate ML Forecast'}
                    </button>
                </div>
            )}

            {!error && forecastData && chartData.length > 0 && (
                <div className="space-y-6">
                    {/* Metrics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="glass-card p-5">
                            <div className="flex items-center gap-3 text-slate-500 mb-2">
                                <Activity size={18} className="text-blue-500" />
                                <span className="font-medium">Selected Model</span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white capitalize">
                                {forecastData.best_model || forecastData.model || 'Holt-Winters'}
                            </h3>
                            <p className="text-xs text-emerald-500 mt-1">Best fit for selected item</p>
                        </div>
                        <div className="glass-card p-5">
                            <div className="flex items-center gap-3 text-slate-500 mb-2">
                                <ChartIcon size={18} className="text-indigo-500" />
                                <span className="font-medium">Model Metrics (MAE)</span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                {forecastData.metrics?.mae?.toFixed(2) || 'N/A'}
                            </h3>
                            <p className="text-xs text-slate-400 mt-1">Mean Absolute Error</p>
                        </div>
                        <div className="glass-card p-5 flex flex-col justify-center">
                            <button
                                onClick={generateForecast}
                                disabled={generating}
                                className="w-full flex justify-center items-center gap-2 px-4 py-3 border border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-medium transition-all"
                            >
                                <RefreshCcw className={generating ? 'animate-spin' : ''} size={18} />
                                {generating ? 'Regenerating...' : 'Regenerate Forecast'}
                            </button>
                        </div>
                    </div>

                    {/* Chart Container */}
                    <div className="glass-card p-6">
                        <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Demand Curve & Confidence Intervals</h3>
                            <div className="flex items-center gap-4 text-sm mt-3 sm:mt-0">
                                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-slate-400"></div><span className="text-slate-600 dark:text-slate-400">Historical</span></div>
                                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span className="text-slate-600 dark:text-slate-400">Forecast</span></div>
                                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-blue-500/20 mix-blend-multiply dark:mix-blend-screen"></div><span className="text-slate-600 dark:text-slate-400">95% CI</span></div>
                            </div>
                        </div>

                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                        tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        dy={10}
                                        minTickGap={30}
                                        axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                        dx={-10}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: 'none', borderRadius: '8px', color: '#fff', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ color: '#fff' }}
                                        labelStyle={{ color: '#94a3b8', marginBottom: '4px', fontWeight: 'bold' }}
                                        labelFormatter={(val) => new Date(val).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' })}
                                    />

                                    {/* Confidence Interval Band */}
                                    <Area
                                        type="monotone"
                                        dataKey="upperBound"
                                        stroke="none"
                                        fill="#3b82f6"
                                        fillOpacity={0.15}
                                        activeDot={false}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="lowerBound"
                                        stroke="none"
                                        fill="#f8fafc" // This acts as a cutout for light base, or we can use custom transparent gradient
                                        fillOpacity={0.8}
                                        className="dark:hidden"
                                        activeDot={false}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="lowerBound"
                                        stroke="none"
                                        fill="#0f172a" // Masking for dark mode
                                        fillOpacity={1}
                                        className="hidden dark:block"
                                        activeDot={false}
                                    />

                                    <Line
                                        type="monotone"
                                        dataKey="sales"
                                        stroke="#94a3b8"
                                        strokeWidth={2.5}
                                        dot={{ r: 3, fill: '#94a3b8', strokeWidth: 0 }}
                                        activeDot={{ r: 6, strokeWidth: 0, fill: '#64748b' }}
                                        name="Historical Sales"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="forecast"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        strokeDasharray="5 5"
                                        dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
                                        activeDot={{ r: 6, strokeWidth: 0, fill: '#2563eb' }}
                                        name="Forecast Value"
                                    />

                                    {splitDate && (
                                        <ReferenceLine
                                            x={splitDate}
                                            stroke="#64748b"
                                            strokeDasharray="3 3"
                                            label={{ position: 'top', value: 'Forecast Start', fill: '#64748b', fontSize: 12 }}
                                        />
                                    )}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {loading && !generating && (
                <div className="flex items-center justify-center h-64 glass-card">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            )}
        </div>
    );
};

export default Forecast;
