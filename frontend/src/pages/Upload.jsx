import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import api from '../api/axios';
import {
    Upload as UploadIcon, FileUp, CheckCircle2,
    AlertCircle, X, FileText, ArrowRight
} from 'lucide-react';

const PISTA = '#7ec062';
const DARK  = '#2d3a2e';
const MUTED = '#9db89e';

const Upload = () => {
    const [file,    setFile]    = useState(null);
    const [preview, setPreview] = useState(null);   // { rows: first5, total: N }
    const [loading, setLoading] = useState(false);
    const [status,  setStatus]  = useState(null);
    const [message, setMessage] = useState('');
    const [detail,  setDetail]  = useState('');
    const fileInputRef = useRef(null);

    const reset = () => {
        setFile(null); setPreview(null);
        setStatus(null); setMessage(''); setDetail('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleFileChange = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setStatus(null); setMessage(''); setDetail('');
        setFile(f);

        // ── Preview parse: ONLY for display, uses preview:5 ─────────────────
        // ✅ KEY FIX: this separate parse is for DISPLAY ONLY.
        //    The actual upload below has NO preview limit.
        Papa.parse(f, {
            header: true, skipEmptyLines: true, preview: 5,
            complete: (res) => {
                // Count total rows with a full parse (fast — no processing)
                Papa.parse(f, {
                    header: true, skipEmptyLines: true,
                    complete: (full) => {
                        setPreview({ rows: res.data, total: full.data.length });
                    },
                });
            },
        });
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const f = e.dataTransfer.files?.[0];
        if (f?.name.endsWith('.csv')) handleFileChange({ target: { files: [f] } });
    };

    const handleUpload = () => {
        if (!file) { setStatus('error'); setMessage('Please select a CSV file.'); return; }
        setLoading(true); setStatus(null);

        // ✅ THE FIX: NO `preview:` option here — parse ALL rows
        //    Before this fix, the code had `preview: 5` here too,
        //    which is why MongoDB only ever got 5-15 rows from a 500-row file.
        Papa.parse(file, {
            header:         true,
            skipEmptyLines: true,
            // ← NO preview: N  — this was the entire bug
            complete: async ({ data }) => {
                if (!data || data.length === 0) {
                    setStatus('error');
                    setMessage('CSV file is empty or could not be parsed.');
                    setLoading(false);
                    return;
                }
                try {
                    const res = await api.post('/api/skus/bulk', { skus: data });
                    setStatus('success');
                    setMessage(res.data?.message || 'Upload successful!');
                    setDetail(
                        `${res.data?.skuCount ?? '?'} SKUs  ·  ` +
                        `${res.data?.historicalRows ?? data.length} historical rows  ·  ` +
                        `${res.data?.forecastPoints ?? 0} forecast points generated`
                    );
                    setFile(null); setPreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                } catch (err) {
                    console.error('Upload error', err);
                    const msg = err.response?.data?.message || 'Upload failed. Check browser console.';
                    setStatus('error');
                    setMessage(msg);
                } finally {
                    setLoading(false);
                }
            },
            error: (err) => {
                setStatus('error');
                setMessage(`CSV parse error: ${err.message}`);
                setLoading(false);
            },
        });
    };

    return (
        <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold mb-1" style={{ color: DARK }}>Data Upload</h1>
                <p className="text-sm" style={{ color: MUTED }}>
                    Upload your SKU forecast CSV to sync data into MongoDB.
                </p>
            </div>

            {/* Success banner */}
            {status === 'success' && (
                <div className="p-4 rounded-xl flex items-start gap-3"
                    style={{ background: 'rgba(168,214,143,0.2)', border: '1px solid rgba(126,192,98,0.4)' }}>
                    <CheckCircle2 size={20} style={{ color: PISTA, flexShrink: 0, marginTop: 1 }} />
                    <div className="flex-1">
                        <p className="text-sm font-semibold" style={{ color: '#2d5a1e' }}>{message}</p>
                        {detail && <p className="text-xs mt-0.5" style={{ color: '#4a7a30' }}>{detail}</p>}
                    </div>
                    <button onClick={reset}><X size={16} style={{ color: MUTED }} /></button>
                </div>
            )}

            {/* Error banner */}
            {status === 'error' && (
                <div className="p-4 rounded-xl flex items-start gap-3"
                    style={{ background: 'rgba(254,202,202,0.3)', border: '1px solid rgba(252,165,165,0.5)' }}>
                    <AlertCircle size={20} style={{ color: '#dc2626', flexShrink: 0, marginTop: 1 }} />
                    <div className="flex-1">
                        <p className="text-sm font-semibold" style={{ color: '#991b1b' }}>Upload Failed</p>
                        <p className="text-xs mt-0.5" style={{ color: '#b91c1c' }}>{message}</p>
                    </div>
                    <button onClick={() => { setStatus(null); setMessage(''); }}>
                        <X size={16} style={{ color: MUTED }} />
                    </button>
                </div>
            )}

            {/* Drop zone */}
            <div className="glass-card p-8">
                <div
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => !file && fileInputRef.current?.click()}
                    style={{
                        border: `2px dashed ${file ? PISTA : 'rgba(168,214,143,0.4)'}`,
                        borderRadius: 14, padding: '3rem 2rem', textAlign: 'center',
                        cursor: file ? 'default' : 'pointer',
                        background: file ? 'rgba(168,214,143,0.06)' : 'rgba(253,250,245,0.4)',
                        transition: 'all 0.2s',
                    }}
                >
                    <input ref={fileInputRef} type="file" accept=".csv"
                        onChange={handleFileChange} className="hidden" />

                    {file ? (
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                                style={{ background: 'rgba(168,214,143,0.2)' }}>
                                <FileText size={28} style={{ color: PISTA }} />
                            </div>
                            <div>
                                <p className="font-semibold text-base" style={{ color: DARK }}>{file.name}</p>
                                <p className="text-sm" style={{ color: MUTED }}>
                                    {(file.size / 1024).toFixed(1)} KB
                                    {preview && ` · ${preview.total.toLocaleString()} rows detected`}
                                </p>
                                {preview?.rows?.[0] && (
                                    <p className="text-xs mt-1" style={{ color: PISTA }}>
                                        Columns: {Object.keys(preview.rows[0]).join(', ')}
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-3 mt-2">
                                <button onClick={e => { e.stopPropagation(); reset(); }}
                                    className="btn-secondary"><X size={14} /> Cancel</button>
                                <button onClick={e => { e.stopPropagation(); handleUpload(); }}
                                    disabled={loading} className="btn-primary">
                                    {loading ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Processing {preview?.total?.toLocaleString() ?? ''} rows…
                                        </>
                                    ) : (
                                        <><UploadIcon size={15} /> Upload & Forecast</>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                                style={{ background: 'rgba(168,214,143,0.12)' }}>
                                <FileUp size={28} style={{ color: PISTA }} />
                            </div>
                            <div>
                                <p className="font-semibold text-base mb-1" style={{ color: DARK }}>
                                    Click to upload or drag & drop
                                </p>
                                <p className="text-sm" style={{ color: MUTED }}>CSV files only · any size</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Preview table */}
                {preview?.rows?.length > 0 && (
                    <div className="mt-5">
                        <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: MUTED }}>
                            Preview — first 5 of {preview.total.toLocaleString()} rows
                        </p>
                        <div className="overflow-x-auto rounded-xl"
                            style={{ border: '1px solid rgba(168,214,143,0.25)' }}>
                            <table className="w-full text-xs">
                                <thead>
                                    <tr style={{ background: 'rgba(168,214,143,0.1)', borderBottom: '1px solid rgba(168,214,143,0.2)' }}>
                                        {Object.keys(preview.rows[0]).map(k => (
                                            <th key={k} className="px-3 py-2 text-left font-bold uppercase tracking-wide whitespace-nowrap"
                                                style={{ color: MUTED }}>{k}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {preview.rows.map((row, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(168,214,143,0.1)' }}>
                                            {Object.values(row).map((v, j) => (
                                                <td key={j} className="px-3 py-2 whitespace-nowrap" style={{ color: DARK }}>
                                                    {v || <span style={{ color: 'rgba(157,184,158,0.4)' }}>—</span>}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Format guide */}
            <div className="glass-card p-6">
                <h3 className="text-sm font-bold mb-3" style={{ color: DARK }}>Accepted CSV Formats</h3>
                <div className="space-y-2 text-sm" style={{ color: MUTED }}>
                    {[
                        ['Format A (retail_sales_2023)', 'date + item_id + sales + store_id  (auto-detected)'],
                        ['Format B (pre-typed)',          'sku_id + type + date + units_sold/expected/...'],
                        ['date',                          'YYYY-MM-DD format, e.g. 2023-01-15'],
                        ['item_id or sku_id',             'the SKU identifier, e.g. item_1 or SKU-6001'],
                        ['sales or units_sold',           'numeric quantity sold (historical rows)'],
                    ].map(([field, desc]) => (
                        <div key={field} className="flex gap-2 items-start">
                            <ArrowRight size={14} style={{ color: PISTA, flexShrink: 0, marginTop: 2 }} />
                            <span><strong style={{ color: DARK }}>{field}</strong> — {desc}</span>
                        </div>
                    ))}
                </div>
                <p className="text-xs mt-3 p-2 rounded-lg" style={{ color: '#4a7a30', background: 'rgba(168,214,143,0.1)' }}>
                    💡 <strong>retail_sales_2023_small.csv</strong> works directly — just upload it as-is.
                    Holt-Winters forecasting runs automatically on the backend.
                </p>
            </div>
        </div>
    );
};

export default Upload;