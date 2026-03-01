import { useEffect, useState } from 'react'
import { Package, Edit3, Trash2, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../services/api'

export default function Items() {
  const [items,   setItems]   = useState([])
  const [page,    setPage]    = useState(1)
  const [total,   setTotal]   = useState(0)
  const [pages,   setPages]   = useState(1)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [editing, setEditing] = useState(null)   // { id, current_stock, lead_time }
  const PER = 15

  const load = () => {
    setLoading(true)
    api.get(`/items?page=${page}&limit=${PER}&store_id=store_1`)
      .then(r => {
        setItems(r.data.items)
        setTotal(r.data.total)
        setPages(r.data.pages)
      })
      .catch(e => setError(e.response?.data?.error || 'Failed to load items.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [page])

  const handleDelete = async (id) => {
    if (!confirm('Delete this item and all its sales records?')) return
    try {
      await api.delete(`/items/${id}`)
      load()
    } catch { setError('Delete failed.') }
  }

  const handleSaveEdit = async () => {
    try {
      await api.put(`/items/${editing.id}`, {
        current_stock: editing.current_stock,
        lead_time:     editing.lead_time,
      })
      setEditing(null)
      load()
    } catch { setError('Update failed.') }
  }

  return (
    <div className="fade-up">
      <div className="page-header">
        <h1>Items</h1>
        <p>Manage SKUs, view history, update stock levels.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Edit Modal */}
      {editing && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(42,35,24,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200
        }}>
          <div className="card fade-up" style={{ width: 360, padding: 0 }}>
            <div className="card-header"><h2>Edit {editing.item_id}</h2></div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Current Stock (units)</label>
                <input className="form-input" type="number"
                  value={editing.current_stock}
                  onChange={e => setEditing(ed => ({ ...ed, current_stock: +e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Lead Time (days)</label>
                <input className="form-input" type="number"
                  value={editing.lead_time}
                  onChange={e => setEditing(ed => ({ ...ed, lead_time: +e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSaveEdit}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2>All Items <span style={{ color: 'var(--ink-muted)', fontWeight: 400, fontSize: '0.875rem' }}>({total} total)</span></h2>
        </div>

        {loading ? (
          <div className="loader-wrap"><div className="spinner" /></div>
        ) : items.length === 0 ? (
          <div className="card-body">
            <div className="empty-state">
              <Package size={36} />
              <h3>No items yet</h3>
              <p style={{ marginBottom: 14 }}>Upload a CSV to import items.</p>
              <Link to="/upload" className="btn btn-primary">Upload Now</Link>
            </div>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Item ID</th>
                    <th>Store</th>
                    <th>Records</th>
                    <th>Total Sales</th>
                    <th>Stock</th>
                    <th>Lead Time</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td><strong>{item.item_id}</strong></td>
                      <td><span className="badge badge-blue">{item.store_id}</span></td>
                      <td style={{ color: 'var(--ink-muted)' }}>{item.record_count?.toLocaleString()}</td>
                      <td>{item.total_sales?.toLocaleString()}</td>
                      <td>
                        <span className={`badge ${item.current_stock < 100 ? 'badge-red' : 'badge-green'}`}>
                          {item.current_stock}
                        </span>
                      </td>
                      <td style={{ color: 'var(--ink-muted)' }}>{item.lead_time}d</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Link to={`/forecast?sku=${item.item_id}`} className="btn btn-ghost btn-sm" title="Forecast">
                            <TrendingUp size={13} />
                          </Link>
                          <button className="btn btn-ghost btn-sm" title="Edit"
                            onClick={() => setEditing({ id: item.id, item_id: item.item_id, current_stock: item.current_stock, lead_time: item.lead_time })}>
                            <Edit3 size={13} />
                          </button>
                          <button className="btn btn-danger btn-sm" title="Delete"
                            onClick={() => handleDelete(item.id)}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid var(--beige-border)' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>
                Page {page} of {pages}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft size={14} /> Prev
                </button>
                <button className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
