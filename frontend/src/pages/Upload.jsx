import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import api from '../api/axios';
import { Upload as UploadIcon, FileUp, CheckCircle2, AlertCircle } from 'lucide-react';

const Upload = () => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null); // 'idle', 'success', 'error'
    const [message, setMessage] = useState('');
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStatus('idle');
            setMessage('');
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setStatus('idle');
            setMessage('');
        }
    };

    const handleUpload = () => {
        if (!file) {
            setStatus('error');
            setMessage('Please select a file to upload.');
            return;
        }

        setLoading(true);
        // Parse CSV to JSON before sending via /api/skus/bulk or similar endpoint
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const data = results.data;
                // Since the original backend expects specific SKU bulk layout, 
                // we simulate an upload endpoint or map it appropriately.
                // Assuming we POST the raw JSON sales data to a custom route or just show success for demo if endpoint isn't ready.

                try {
                    // Try to post to our api, if no specific bulk upload exists we post to /api/skus/bulk or /api/items
                    const payload = {
                        skus: data.map(row => ({
                            sku_id: row.item_id || row.id,
                            historical_sales: [
                                { date: row.date, quantity: Number(row.sales) || Number(row.quantity) }
                            ]
                        }))
                    };

                    // For the sake of this demo, let's assume the endpoint accepts this mapped structure
                    await api.post('/api/skus/bulk', payload);

                    setStatus('success');
                    setMessage(`Successfully uploaded and parsed ${data.length} rows.`);
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                } catch (error) {
                    console.error("Upload error", error);
                    setStatus('error');
                    setMessage(error.response?.data?.message || 'Failed to sync data with server.');
                } finally {
                    setLoading(false);
                }
            },
            error: (error) => {
                setStatus('error');
                setMessage(`CSV Parsing Error: ${error.message}`);
                setLoading(false);
            }
        });
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-1">Data Upload</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Upload your historical sales data (CSV) for ML processing.</p>
            </div>

            <div className="glass-card p-8">
                <div
                    className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${file ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10' : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer'
                        }`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => !file && fileInputRef.current?.click()}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".csv"
                        className="hidden"
                    />

                    {file ? (
                        <div className="flex flex-col items-center">
                            <div className="p-4 bg-blue-100 dark:bg-blue-900/50 rounded-full mb-4 text-blue-600 dark:text-blue-400">
                                <FileUp size={32} />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">{file.name}</h3>
                            <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>

                            <div className="mt-8 flex gap-3">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setFile(null);
                                        setStatus(null);
                                        if (fileInputRef.current) fileInputRef.current.value = '';
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleUpload();
                                    }}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <UploadIcon size={16} />
                                            Process Data
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-4 text-slate-500 dark:text-slate-400">
                                <UploadIcon size={32} />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Click to upload or drag and drop</h3>
                            <p className="text-sm text-slate-500">Only CSV files are supported</p>
                        </div>
                    )}
                </div>

                {/* Status Messages */}
                {status === 'success' && (
                    <div className="mt-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-800">
                        <CheckCircle2 size={24} className="shrink-0 text-emerald-600" />
                        <div>
                            <h4 className="font-semibold text-emerald-900">Upload Successful</h4>
                            <p className="text-sm mt-1 text-emerald-700">{message}</p>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="mt-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3 text-red-800">
                        <AlertCircle size={24} className="shrink-0 text-red-600" />
                        <div>
                            <h4 className="font-semibold text-red-900">Upload Failed</h4>
                            <p className="text-sm mt-1 text-red-700">{message}</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="glass-card p-6">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Required CSV Format</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-800/50 dark:text-slate-300">
                            <tr>
                                <th className="px-4 py-3 border-b dark:border-slate-700">date</th>
                                <th className="px-4 py-3 border-b dark:border-slate-700">item_id</th>
                                <th className="px-4 py-3 border-b dark:border-slate-700">sales (quantity)</th>
                                <th className="px-4 py-3 border-b dark:border-slate-700">store_id (optional)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="bg-white dark:bg-transparent border-b dark:border-slate-800">
                                <td className="px-4 py-3">2023-01-01</td>
                                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">item_1</td>
                                <td className="px-4 py-3">45</td>
                                <td className="px-4 py-3">store_1</td>
                            </tr>
                            <tr className="bg-white dark:bg-transparent">
                                <td className="px-4 py-3">2023-01-02</td>
                                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">item_1</td>
                                <td className="px-4 py-3">42</td>
                                <td className="px-4 py-3">store_1</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Upload;
