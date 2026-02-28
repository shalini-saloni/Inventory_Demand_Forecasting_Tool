import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import {
    Package,
    AlertTriangle,
    TrendingUp,
    Activity,
    ArrowUpRight
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const StatCard = ({ title, value, subtitle, icon: Icon, trend }) => (
    <div className="glass-card p-6 flex items-start gap-4 hover:-translate-y-1 transition-transform duration-300">
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <Icon size={24} />
        </div>
        <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{value}</h3>
            {subtitle && (
                <div className="flex items-center gap-1 mt-1 text-sm">
                    {trend === 'up' && <ArrowUpRight size={16} className="text-emerald-500" />}
                    <span className="text-slate-500 dark:text-slate-400">{subtitle}</span>
                </div>
            )}
        </div>
    </div>
);

// Mock data for the chart since the summary endpoint doesn't return time-series
const mockChartData = [
    { name: 'Jan', sales: 4000, forecast: 4400 },
    { name: 'Feb', sales: 3000, forecast: 3200 },
    { name: 'Mar', sales: 2000, forecast: 2400 },
    { name: 'Apr', sales: 2780, forecast: 2900 },
    { name: 'May', sales: 1890, forecast: 2100 },
    { name: 'Jun', sales: 2390, forecast: 2500 },
    { name: 'Jul', sales: 3490, forecast: 3600 },
];

const Dashboard = () => {
    const [summary, setSummary] = useState({
        total_global_demand: 0,
        total_skus: 0,
        items: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const res = await api.get('/api/skus/summary');
                setSummary(res.data);
                setError(null);
            } catch (err) {
                console.error("Failed to fetch dashboard summary", err);
                setError("Failed to load dashboard data. Please check your backend.");
            } finally {
                setLoading(false);
            }
        };

        fetchSummary();
    }, []);

    // Placeholder computation for restocking alerts if backend didn't supply it directly
    const reorderCount = summary.items ? Math.floor(summary.items.length * 0.2) : 0; // 20% mocked as needing reorder for demo

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-1">Overview Dashboard</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Welcome back. Here's your global inventory outlook.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Tracked SKUs"
                    value={summary.total_skus.toLocaleString()}
                    subtitle="Active items"
                    icon={Package}
                />
                <StatCard
                    title="Forecasted Demand"
                    value={summary.total_global_demand.toLocaleString()}
                    subtitle="+5.4% vs last period"
                    trend="up"
                    icon={TrendingUp}
                />
                <StatCard
                    title="Reorder Alerts"
                    value={reorderCount.toLocaleString()}
                    subtitle="Require immediate action"
                    icon={AlertTriangle}
                />
                <StatCard
                    title="System Status"
                    value="Optimal"
                    subtitle="ML engine online"
                    icon={Activity}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-card p-6">
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Global Sales & Forecast Trend</h3>
                        <p className="text-sm text-slate-500">Historical performance vs ML predictions</p>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={mockChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: 'none', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="sales" stroke="#94a3b8" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" name="Historical Sales" />
                                <Area type="monotone" dataKey="forecast" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorForecast)" name="Forecasted Demand" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-card p-6">
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Recent Activities</h3>
                        <p className="text-sm text-slate-500">System logs & alerts</p>
                    </div>
                    <div className="space-y-4">
                        {[
                            { title: 'New data uploaded', time: '2 hours ago', type: 'info' },
                            { title: 'Forecast generated for item_1', time: '5 hours ago', type: 'success' },
                            { title: 'Reorder triggered: item_4', time: '1 day ago', type: 'warning' },
                            { title: 'Forecast generated for item_2', time: '1 day ago', type: 'success' },
                        ].map((activity, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <div className={`w-2 h-2 mt-2 rounded-full ${activity.type === 'warning' ? 'bg-orange-500' :
                                        activity.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
                                    }`}></div>
                                <div>
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{activity.title}</p>
                                    <span className="text-xs text-slate-500">{activity.time}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
