import { useState, useRef } from 'react'
import { Upload as UploadIcon, FileText, CheckCircle, XCircle, Info } from 'lucide-react'
import api from '../services/api'

export default function Upload() {
  const [dragging,  setDragging]  = useState(false)
  const [file,      setFile]      = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [result,    setResult]    = useState(null)
  const [error,     setError]     = useState('')
  const inputRef = useRef()

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f && f.name.endsWith('.csv')) { setFile(f); setError(''); setResult(null) }
    else setError('Please upload a CSV file.')
  }

  const handleFile = (e) => {
    const f = e.target.files[0]
    if (f) { setFile(f); setError(''); setResult(null) }
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    setResult(null)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const { data } = await api.post('/items/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResult(data)
      setFile(null)
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fade-up">
      <div className="page-header">
        <h1>Upload Sales Data</h1>
        <p>Import CSV to populate the forecasting engine.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        <div>
          {/* Dropzone */}
          <div
            className={`dropzone ${dragging ? 'active' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <UploadIcon size={40} />
            <h3>Drag & drop your CSV here</h3>
            <p>or click to browse files</p>
            <input ref={inputRef} type="file" accept=".csv" hidden onChange={handleFile} />
          </div>

          {file && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, padding: '12px 16px', background: 'var(--beige)', borderRadius: 'var(--radius)', border: '1px solid var(--beige-border)' }}>
              <FileText size={18} color="var(--pista-dark)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{file.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>{(file.size / 1024).toFixed(1)} KB</div>
              </div>
              <button className="btn btn-primary" onClick={handleUpload} disabled={loading}>
                {loading ? 'Uploading…' : 'Upload & Process'}
              </button>
            </div>
          )}

          {error  && <div className="alert alert-error"  style={{ marginTop: 14 }}><XCircle size={16} />{error}</div>}

          {result && (
            <div className="card fade-up" style={{ marginTop: 20 }}>
              <div className="card-header" style={{ background: 'var(--pista-50)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={18} color="var(--pista-dark)" />
                  <h2 style={{ color: 'var(--pista-dark)' }}>Upload Successful</h2>
                </div>
              </div>
              <div className="card-body">
                <p style={{ marginBottom: 14, color: 'var(--ink-muted)' }}>{result.message}</p>
                <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                  <div className="metric-chip">Original shape<span>{result.original_shape?.join(' × ')}</span></div>
                  <div className="metric-chip">Final shape<span>{result.final_shape?.join(' × ')}</span></div>
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 8 }}>Cleaning steps:</div>
                <ol style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {result.cleaning_report?.map((s, i) => (
                    <li key={i} style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>{s}</li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Schema guide */}
        <div>
          <div className="card">
            <div className="card-header"><h2>Required Schema</h2></div>
            <div className="card-body">
              <div className="alert alert-warning" style={{ marginBottom: 16 }}>
                <Info size={15} style={{ flexShrink: 0 }} />
                Your CSV must contain these columns:
              </div>
              <table style={{ width: '100%', fontSize: '0.8125rem' }}>
                <thead>
                  <tr>
                    <th>Column</th>
                    <th>Type</th>
                    <th>Required</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['date',     'Date',    '✓'],
                    ['item_id',  'String',  '✓'],
                    ['sales',    'Number',  '✓'],
                    ['store_id', 'String',  ''],
                    ['price',    'Number',  ''],
                    ['promo',    '0 or 1',  ''],
                  ].map(([col, type, req]) => (
                    <tr key={col}>
                      <td><code style={{ background: 'var(--beige)', padding: '2px 6px', borderRadius: 4 }}>{col}</code></td>
                      <td style={{ color: 'var(--ink-muted)' }}>{type}</td>
                      <td>{req && <span className="badge badge-green">{req}</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: 20 }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 8 }}>Sample rows</div>
                <pre style={{
                  background: 'var(--ink)', color: '#A8D5A7',
                  padding: 12, borderRadius: 8, fontSize: '0.7rem',
                  overflowX: 'auto', lineHeight: 1.7,
                }}>
{`date,store_id,item_id,sales
2023-01-01,store_1,item_1,41
2023-01-02,store_1,item_1,48
2023-01-01,store_1,item_2,33`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
