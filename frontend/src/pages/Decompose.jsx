import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../services/api'

const PANEL_COLORS = { observed: '#2A2318', trend: '#8B5CF6', seasonal: '#7CB87A', residual: '#F59E0B' }

function DecompPanel({ title, data, color }) {
  if (!data?.length) return null
  return (
    <div className="card fade-up" style={{ marginBottom: 20 }}>
      <div className="card-header"><h2>{title}</h2></div>
      <div className="card-body" style={{ paddingTop: 8 }}>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--beige-border)" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--ink-light)' }}
              tickFormatter={d => d?.slice(5)} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11, fill: 'var(--ink-light)' }} />
            <Tooltip
              contentStyle={{ background: 'var(--white)', border: '1px solid var(--beige-border)', borderRadius: 8, fontSize: 12 }}
              formatter={v => [v?.toFixed(2), title]}
            />
            <Line dataKey="value" stroke={color} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default function Decompose() {
  const [sku,     setSku]     = useState('')
  const [period,  setPeriod]  = useState(7)
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const run = async () => {
    if (!sku.trim()) return setError('Enter an item ID.')
    setLoading(true); setError(''); setData(null)
    try {
      const { data: d } = await api.get(
        `/forecast/decompose/${sku.trim()}?seasonal_period=${period}&store_id=store_1`
      )
      setData(d)
    } catch (e) {
      setError(e.response?.data?.error || 'Decomposition failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fade-up">
      <div className="page-header">
        <h1>Seasonality Decomposition</h1>
        <p>Break down time-series into trend, seasonal, and residual components.</p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body">
          <div className="forecast-controls">
            <div className="form-group" style={{ minWidth: 180 }}>
              <label className="form-label">Item ID (SKU)</label>
              <input className="form-input" placeholder="e.g. item_1" value={sku}
                onChange={e => setSku(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && run()} />
            </div>
            <div className="form-group">
              <label className="form-label">Seasonal Period</label>
              <select className="form-select" value={period} onChange={e => setPeriod(+e.target.value)}>
                <option value={7}>7 (Weekly)</option>
                <option value={30}>30 (Monthly)</option>
              </select>
            </div>
            <button className="btn btn-primary" onClick={run} disabled={loading}>
              <RefreshCw size={15} />
              {loading ? 'Decomposing…' : 'Decompose'}
            </button>
          </div>
          {error && <div className="alert alert-error">{error}</div>}
        </div>
      </div>

      {loading && <div className="loader-wrap"><div className="spinner" /><span>Decomposing series…</span></div>}

      {data && (
        <>
          <div className="alert alert-success" style={{ marginBottom: 20 }}>
            Showing additive decomposition for <strong>{data.sku}</strong> with period = {period}
          </div>
          <DecompPanel title="Observed"  data={data.observed}  color={PANEL_COLORS.observed}  />
          <DecompPanel title="Trend"     data={data.trend}     color={PANEL_COLORS.trend}     />
          <DecompPanel title="Seasonal"  data={data.seasonal}  color={PANEL_COLORS.seasonal}  />
          <DecompPanel title="Residual"  data={data.residual}  color={PANEL_COLORS.residual}  />
        </>
      )}
    </div>
  )
}
