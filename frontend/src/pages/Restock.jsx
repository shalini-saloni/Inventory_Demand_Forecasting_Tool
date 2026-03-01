import { useEffect, useState } from 'react'
import { ShoppingCart, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Cell, ResponsiveContainer, LabelList
} from 'recharts'
import api from '../services/api'

export default function Restock() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const load = () => {
    setLoading(true); setError('')
    api.get('/restock?store_id=store_1')
      .then(r => setData(r.data))
      .catch(e => setError(e.response?.data?.error || 'Failed to load recommendations.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const recs = data?.recommendations || []
  const alerts = recs.filter(r => r.reorder_alert)

  return (
    <div className="fade-up">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Restock Recommendations</h1>
          <p>AI-driven reorder suggestions based on Holt-Winters forecasts.</p>
        </div>
        <button className="btn btn-ghost" onClick={load} disabled={loading}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {error   && <div className="alert alert-error">{error}</div>}
      {loading && <div className="loader-wrap"><div className="spinner" /><span>Generating recommendations…</span></div>}

      {data && !loading && (
        <>
          {/* Alert Banner */}
          {alerts.length > 0 && (
            <div className="alert alert-warning" style={{ marginBottom: 24 }}>
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              <strong>{alerts.length} SKU{alerts.length > 1 ? 's' : ''} need{alerts.length === 1 ? 's' : ''} immediate restocking:</strong>
              {' '}{alerts.map(a => a.item_id).join(', ')}
            </div>
          )}

          {/* Summary */}
          <div className="stat-grid" style={{ marginBottom: 24 }}>
            <div className="stat-card">
              <div className="stat-label">Total SKUs Analysed</div>
              <div className="stat-value">{recs.length}</div>
            </div>
            <div className="stat-card alert">
              <div className="stat-label">Reorder Alerts</div>
              <div className="stat-value">{data.low_stock_count}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Units to Order</div>
              <div className="stat-value">{recs.reduce((s, r) => s + (r.recommended_order_qty || 0), 0).toLocaleString()}</div>
            </div>
          </div>

          {/* Bar Chart */}
          {recs.length > 0 && (
            <div className="card fade-up" style={{ marginBottom: 24 }}>
              <div className="card-header"><h2>Recommended Order Quantities</h2></div>
              <div className="card-body" style={{ paddingTop: 8 }}>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={recs} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--beige-border)" vertical={false} />
                    <XAxis dataKey="item_id" tick={{ fontSize: 12, fill: 'var(--ink)' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--ink-light)' }} />
                    <Tooltip
                      contentStyle={{ background: 'var(--white)', border: '1px solid var(--beige-border)', borderRadius: 8, fontSize: 12 }}
                      formatter={v => [v, 'Recommended Order']}
                    />
                    <Bar dataKey="recommended_order_qty" radius={[6, 6, 0, 0]} name="Recommended Order">
                      {recs.map((r, i) => (
                        <Cell key={i} fill={r.reorder_alert ? '#D96B6B' : '#7CB87A'} />
                      ))}
                      <LabelList dataKey="recommended_order_qty" position="top" style={{ fontSize: 11, fontWeight: 600, fill: 'var(--ink)' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Table */}
          {recs.length > 0 ? (
            <div className="card fade-up">
              <div className="card-header"><h2>Detailed Recommendations</h2></div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Item ID</th>
                      <th>Current Stock</th>
                      <th>Forecast Demand</th>
                      <th>Lead-Time Demand</th>
                      <th>Days of Stock</th>
                      <th>Order Qty</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recs.map(r => (
                      <tr key={r.item_id}>
                        <td><strong>{r.item_id}</strong></td>
                        <td>{r.current_stock} units</td>
                        <td>{r.forecasted_demand_total}</td>
                        <td>{r.demand_during_lead_time}</td>
                        <td>
                          <span className={`badge ${r.days_of_stock_remaining < 7 ? 'badge-red' : 'badge-amber'}`}>
                            {r.days_of_stock_remaining}d
                          </span>
                        </td>
                        <td><strong>{r.recommended_order_qty}</strong></td>
                        <td>
                          {r.reorder_alert
                            ? <span className="badge badge-red"><AlertTriangle size={11} /> Reorder Now</span>
                            : <span className="badge badge-green"><CheckCircle size={11} /> OK</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-body">
                <div className="empty-state">
                  <ShoppingCart size={36} />
                  <h3>No recommendations yet</h3>
                  <p>Upload sales data and the engine will generate restocking suggestions.</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
