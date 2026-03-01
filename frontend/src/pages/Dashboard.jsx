import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, TrendingUp, BarChart2, AlertTriangle, ChevronRight } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../services/api'

const STORE = 'store_1'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/dashboard?store_id=${STORE}`)
      .then(r => setData(r.data))
      .catch(e => setError(e.response?.data?.error || 'Failed to load dashboard.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loader-wrap"><div className="spinner" /><span>Loading dashboard…</span></div>
  if (error) return <div className="alert alert-error">{error}</div>

  const stats = [
    { label: 'Total SKUs', value: data.total_skus, icon: Package, color: '' },
    { label: 'Total Sales', value: data.total_sales.toLocaleString(), icon: TrendingUp, color: '' },
    { label: 'Avg Daily Demand', value: data.avg_demand.toFixed(1), icon: BarChart2, color: 'is-blue' },
    { label: 'Low Stock SKUs', value: data.low_stock_count, icon: AlertTriangle, color: 'is-alert' },
  ]

  return (
    <div className="fade-up">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Inventory overview for {STORE}</p>
      </div>

      <div className="stat-grid">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className={`stat-card ${color}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="stat-label">{label}</div>
                <div className="stat-value">{value}</div>
              </div>
              <div style={{ padding: 10, background: 'var(--pista-50)', borderRadius: 10 }}>
                <Icon size={20} color="var(--pista-dark)" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Trend Chart */}
      <div className="card fade-up" style={{ animationDelay: '0.1s', marginBottom: 24 }}>
        <div className="card-header">
          <h2>Daily Sales Trend (Last 90 Days)</h2>
          <Link to="/forecast" className="btn btn-ghost btn-sm">
            View Forecast <ChevronRight size={14} />
          </Link>
        </div>
        <div className="card-body" style={{ paddingTop: 8 }}>
          {data.trend_chart.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.trend_chart} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7CB87A" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#7CB87A" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--beige-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--ink-light)' }}
                  tickFormatter={d => d.slice(5)} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: 'var(--ink-light)' }} />
                <Tooltip
                  contentStyle={{ background: 'var(--white)', border: '1px solid var(--beige-border)', borderRadius: 8, fontSize: 13 }}
                  formatter={v => [v.toLocaleString(), 'Total Sales']}
                />
                <Area type="monotone" dataKey="value" stroke="var(--pista)" strokeWidth={2}
                  fill="url(#salesGrad)" dot={false} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">No trend data yet. Upload sales data to get started.</div>
          )}
        </div>
      </div>

      {/* SKU Stats */}
      {data.sku_stats?.length > 0 && (
        <div className="card fade-up" style={{ animationDelay: '0.15s' }}>
          <div className="card-header">
            <h2>SKU Overview</h2>
            <Link to="/items" className="btn btn-ghost btn-sm">
              Manage Items <ChevronRight size={14} />
            </Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Item ID</th>
                  <th>Store</th>
                  <th>Total Sales</th>
                  <th>Current Stock</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.sku_stats.map(row => (
                  <tr key={row.item_pk}>
                    <td><strong>{row.item_id}</strong></td>
                    <td><span className="badge badge-blue">{row.store_id}</span></td>
                    <td>{row.total_sales.toLocaleString()}</td>
                    <td>
                      <span className={`badge ${row.current_stock < 100 ? 'badge-red' : 'badge-green'}`}>
                        {row.current_stock} units
                      </span>
                    </td>
                    <td>
                      <Link to={`/forecast?sku=${row.item_id}`} className="btn btn-ghost btn-sm">
                        Forecast
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(!data.sku_stats || data.sku_stats.length === 0) && (
        <div className="card">
          <div className="card-body">
            <div className="empty-state">
              <Package size={40} />
              <h3>No data yet</h3>
              <p style={{ marginBottom: 16 }}>Upload a CSV file to start forecasting demand.</p>
              <Link to="/upload" className="btn btn-primary">Upload Data</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
