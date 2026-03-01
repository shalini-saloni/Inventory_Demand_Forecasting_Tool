import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, RefreshCw } from 'lucide-react'
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts'
import api from '../services/api'

const METHODS  = [
  { value: 'holt_winters',   label: 'Holt-Winters (Default)' },
  { value: 'ses',            label: 'Exponential Smoothing' },
  { value: 'moving_average', label: 'Moving Average' },
]
const SEASONS  = [{ value: 7, label: '7 (Weekly)' }, { value: 30, label: '30 (Monthly)' }, { value: 365, label: '365 (Yearly)' }]
const HORIZONS = [{ value: 14, label: '14 Days' }, { value: 30, label: '30 Days' }, { value: 60, label: '60 Days' }]

const COLORS = { historical: '#2A2318', ma: '#3B82F6', ses: '#F59E0B', hw: '#7CB87A' }
const METHOD_COLOR = { holt_winters: COLORS.hw, ses: COLORS.ses, moving_average: COLORS.ma }

// Merge historical tail + forecast for the comparison chart
function buildCompareData(hist, forecasts) {
  const tail  = hist.slice(-60)
  const start = forecasts.holt_winters?.[0]?.date
  const tailFiltered = tail.filter(d => !start || d.date < start)
  const histPoints = tailFiltered.map(d => ({ date: d.date, historical: d.value }))
  const fLen = Math.max(
    forecasts.holt_winters?.length || 0,
    forecasts.ses?.length || 0,
    forecasts.moving_average?.length || 0
  )
  const fPoints = Array.from({ length: fLen }, (_, i) => {
    const date = forecasts.holt_winters?.[i]?.date || forecasts.ses?.[i]?.date || ''
    return {
      date,
      hw:  forecasts.holt_winters?.[i]?.value,
      ses: forecasts.ses?.[i]?.value,
      ma:  forecasts.moving_average?.[i]?.value,
    }
  })
  return [...histPoints, ...fPoints]
}

// Build single-method chart data
function buildChartData(historical, forecast, ciUpper, ciLower) {
  const tail = historical.slice(-90)
  const fStart = forecast[0]?.date
  const histPts = tail.filter(d => !fStart || d.date < fStart)
    .map(d => ({ date: d.date, actual: d.value }))
  const fPts = forecast.map((d, i) => ({
    date:    d.date,
    forecast: d.value,
    ci:      [ciLower[i]?.value ?? d.value, ciUpper[i]?.value ?? d.value],
  }))
  return [...histPts, ...fPts]
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--beige-border)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color || p.stroke, marginBottom: 2 }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</strong>
        </div>
      ))}
    </div>
  )
}

export default function ForecastPage() {
  const [searchParams] = useSearchParams()
  const [sku,      setSku]     = useState(searchParams.get('sku') || '')
  const [method,   setMethod]  = useState('holt_winters')
  const [horizon,  setHorizon] = useState(30)
  const [period,   setPeriod]  = useState(7)
  const [data,     setData]    = useState(null)
  const [loading,  setLoading] = useState(false)
  const [error,    setError]   = useState('')

  const run = async () => {
    if (!sku.trim()) return setError('Enter an item ID.')
    setLoading(true); setError(''); setData(null)
    try {
      const { data: d } = await api.get(
        `/forecast/${sku.trim()}?method=${method}&horizon=${horizon}&seasonal_period=${period}&store_id=store_1`
      )
      setData(d)
    } catch (e) {
      setError(e.response?.data?.error || 'Forecast failed.')
    } finally {
      setLoading(false)
    }
  }

  // Auto-run if sku from query param
  useEffect(() => { if (sku) run() }, [])

  const handleExport = async () => {
    const url = `/api/forecast/${sku}/export?seasonal_period=${period}&horizon=${horizon}&store_id=store_1`
    window.open(url, '_blank')
  }

  const primaryColor = METHOD_COLOR[method] || COLORS.hw
  const chartData    = data ? buildChartData(data.historical, data.forecast, data.ci_upper, data.ci_lower) : []
  const compareData  = data ? buildCompareData(data.historical, data.all_forecasts) : []
  const forecastStart = data?.forecast?.[0]?.date

  return (
    <div className="fade-up">
      <div className="page-header">
        <h1>Demand Forecast</h1>
        <p>Predict future demand per SKU with time-series models.</p>
      </div>

      {/* Controls */}
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
              <label className="form-label">Model</label>
              <select className="form-select" value={method} onChange={e => setMethod(e.target.value)}>
                {METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Horizon</label>
              <select className="form-select" value={horizon} onChange={e => setHorizon(+e.target.value)}>
                {HORIZONS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Seasonal Period</label>
              <select className="form-select" value={period} onChange={e => setPeriod(+e.target.value)}>
                {SEASONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" onClick={run} disabled={loading}>
              <RefreshCw size={15} className={loading ? 'spin' : ''} />
              {loading ? 'Running…' : 'Run Forecast'}
            </button>
            {data && (
              <button className="btn btn-ghost" onClick={handleExport}>
                <Download size={15} /> Export CSV
              </button>
            )}
          </div>
          {error && <div className="alert alert-error">{error}</div>}
        </div>
      </div>

      {loading && <div className="loader-wrap"><div className="spinner" /><span>Running models…</span></div>}

      {data && (
        <>
          {/* Metrics */}
          <div className="metrics-row">
            {data.metrics?.hw && <>
              <div className="metric-chip">MAE  <span>{data.metrics.hw.MAE}</span></div>
              <div className="metric-chip">RMSE <span>{data.metrics.hw.RMSE}</span></div>
              <div className="metric-chip">MAPE <span>{data.metrics.hw['MAPE%']}%</span></div>
            </>}
            {data.alpha && <div className="metric-chip">SES α <span>{data.alpha}</span></div>}
            <div className="metric-chip">Train <span>{data.train_size}d</span></div>
            <div className="metric-chip">Test  <span>{data.test_size}d</span></div>
            {data.restock?.reorder_alert
              ? <span className="badge badge-red">🔴 Reorder Alert!</span>
              : <span className="badge badge-green">🟢 Stock OK</span>
            }
          </div>

          {/* Restock Info */}
          <div className="card fade-up" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <h2>Restock Recommendation</h2>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                {[
                  ['Current Stock',       data.restock.current_stock + ' units'],
                  ['Forecast Demand',     data.restock.forecasted_demand_total + ' units'],
                  ['Lead-Time Demand',    data.restock.demand_during_lead_time + ' units'],
                  ['Recommended Order',   data.restock.recommended_order_qty + ' units'],
                  ['Days of Stock Left',  data.restock.days_of_stock_remaining + ' days'],
                ].map(([label, val]) => (
                  <div key={label} style={{ flex: '1 1 150px', background: 'var(--beige)', borderRadius: 'var(--radius)', padding: '14px 18px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ink-light)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--ink)', marginTop: 4 }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Primary Forecast Chart */}
          <div className="card fade-up" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <h2>Forecast — {METHODS.find(m => m.value === method)?.label}</h2>
            </div>
            <div className="card-body" style={{ paddingTop: 8 }}>
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--beige-border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--ink-light)' }}
                    tickFormatter={d => d?.slice(5)} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--ink-light)' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {forecastStart && (
                    <ReferenceLine x={forecastStart} stroke="var(--red)" strokeDasharray="4 3"
                      label={{ value: 'Forecast Start', position: 'insideTopLeft', fontSize: 11, fill: 'var(--red)' }} />
                  )}
                  {/* CI band */}
                  <Area dataKey="ci" stroke="none" fill={primaryColor} fillOpacity={0.12}
                    name="95% CI" legendType="none" />
                  <Line dataKey="actual" stroke="var(--ink)" strokeWidth={1.5} dot={false} name="Historical" />
                  <Line dataKey="forecast" stroke={primaryColor} strokeWidth={2.5} strokeDasharray="6 3"
                    dot={false} name="Forecast" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Model Comparison Chart */}
          <div className="card fade-up" style={{ marginBottom: 24 }}>
            <div className="card-header"><h2>All Models Comparison</h2></div>
            <div className="card-body" style={{ paddingTop: 8 }}>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={compareData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--beige-border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--ink-light)' }}
                    tickFormatter={d => d?.slice(5)} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--ink-light)' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {forecastStart && (
                    <ReferenceLine x={forecastStart} stroke="var(--red)" strokeDasharray="4 3" />
                  )}
                  <Line dataKey="historical" stroke="var(--ink)" strokeWidth={1.5} dot={false} name="Historical" />
                  <Line dataKey="hw"  stroke={COLORS.hw}  strokeWidth={2} strokeDasharray="6 3" dot={false} name="Holt-Winters" />
                  <Line dataKey="ses" stroke={COLORS.ses} strokeWidth={2} strokeDasharray="4 2" dot={false} name="SES" />
                  <Line dataKey="ma"  stroke={COLORS.ma}  strokeWidth={2} strokeDasharray="2 2" dot={false} name="Moving Avg" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
