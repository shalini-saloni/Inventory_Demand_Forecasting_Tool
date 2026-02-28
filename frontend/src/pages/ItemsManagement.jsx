import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Search, Trash2, Package, X, Tag, Clock, Pencil, CheckCircle2, AlertCircle } from 'lucide-react';

const PISTA = '#7ec062';
const DARK  = '#2d3a2e';
const MUTED = '#9db89e';

// ── Small toast notification ──────────────────────────────────────────────────
const Toast = ({ toast, onClose }) => {
    useEffect(() => {
        const t = setTimeout(onClose, 3000);
        return () => clearTimeout(t);
    }, [onClose]);
    const isOk = toast.type === 'success';
    return (
        <div style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
            display: 'flex', alignItems: 'center', gap: 10,
            background: isOk ? 'rgba(45,90,30,0.96)' : 'rgba(153,27,27,0.96)',
            color: '#fff', padding: '12px 18px', borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)', fontSize: 14, fontWeight: 600,
            animation: 'fadeSlideIn 0.3s ease',
        }}>
            {isOk
                ? <CheckCircle2 size={18} style={{ color: '#a8d68f' }} />
                : <AlertCircle  size={18} style={{ color: '#fca5a5' }} />
            }
            {toast.message}
        </div>
    );
};

// ── Confirmation modal (replaces window.confirm) ─────────────────────────────
const ConfirmModal = ({ item, onConfirm, onCancel }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(45,58,46,0.5)', backdropFilter: 'blur(6px)' }}>
        <div className="glass-card w-full max-w-sm p-6 shadow-2xl animate-fade-in text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(254,202,202,0.3)' }}>
                <Trash2 size={24} style={{ color: '#dc2626' }} />
            </div>
            <h3 className="text-base font-bold mb-1" style={{ color: DARK }}>Delete Item?</h3>
            <p className="text-sm mb-5" style={{ color: MUTED }}>
                <strong style={{ color: DARK }}>{item?.sku}</strong> — {item?.name}<br />
                This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-center">
                <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
                <button onClick={onConfirm}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
                    style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 4px 14px rgba(220,38,38,0.3)' }}>
                    <Trash2 size={15} /> Delete
                </button>
            </div>
        </div>
    </div>
);

const EMPTY_FORM = { name: '', sku: '', category: 'General', basePrice: '', leadTimeDays: 7 };

const ItemsManagement = () => {
    const [items,        setItems]       = useState([]);
    const [loading,      setLoading]     = useState(true);
    const [searchTerm,   setSearchTerm]  = useState('');
    const [toast,        setToast]       = useState(null);

    // Add/Edit modal
    const [modalOpen,    setModalOpen]   = useState(false);
    const [editItem,     setEditItem]    = useState(null);   // null = add, object = edit
    const [formLoading,  setFormLoading] = useState(false);
    const [formError,    setFormError]   = useState('');
    const [formData,     setFormData]    = useState(EMPTY_FORM);

    // Delete confirmation modal
    const [deleteTarget, setDeleteTarget] = useState(null);  // item to delete

    useEffect(() => { fetchItems(); }, []);

    const fetchItems = async () => {
        try {
            const res = await api.get('/api/items');
            setItems(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Failed to fetch items', err);
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    // ── Open Add modal ────────────────────────────────────────────────────────
    const openAdd = () => {
        setEditItem(null);
        setFormData(EMPTY_FORM);
        setFormError('');
        setModalOpen(true);
    };

    // ── Open Edit modal ───────────────────────────────────────────────────────
    const openEdit = (item) => {
        setEditItem(item);
        setFormData({
            name:         item.name        || '',
            sku:          item.sku         || '',
            category:     item.category    || 'General',
            basePrice:    item.basePrice   ?? '',
            leadTimeDays: item.leadTimeDays ?? 7,
        });
        setFormError('');
        setModalOpen(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(p => ({ ...p, [name]: value }));
    };

    // ── Save (add or edit) ────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!formData.name || !formData.sku) { setFormError('Name and SKU are required.'); return; }
        setFormLoading(true); setFormError('');
        try {
            const payload = {
                ...formData,
                basePrice:    Number(formData.basePrice)    || 0,
                leadTimeDays: Number(formData.leadTimeDays) || 7,
            };
            if (editItem) {
                await api.put(`/api/items/${editItem._id}`, payload);
                showToast(`${formData.sku} updated successfully`);
            } else {
                await api.post('/api/items', payload);
                showToast(`${formData.sku} added successfully`);
            }
            setModalOpen(false);
            setFormData(EMPTY_FORM);
            setEditItem(null);
            fetchItems();
        } catch (err) {
            setFormError(err.response?.data?.message || 'Failed to save item.');
        } finally {
            setFormLoading(false);
        }
    };

    // ── Delete: open confirmation modal ──────────────────────────────────────
    const handleDeleteClick = (item) => {
        setDeleteTarget(item);
    };

    // ── Delete: confirmed ─────────────────────────────────────────────────────
    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        try {
            await api.delete(`/api/items/${deleteTarget._id}`);
            showToast(`${deleteTarget.sku} deleted`);
            setDeleteTarget(null);
            fetchItems();
        } catch (err) {
            showToast('Failed to delete item', 'error');
            setDeleteTarget(null);
        }
    };

    const filtered = items.filter(i =>
        (i.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         i.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         i.category?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const avgLeadTime = items.length
        ? Math.round(items.reduce((s, i) => s + (i.leadTimeDays || 0), 0) / items.length)
        : null;
    const categories = new Set(items.map(i => i.category).filter(Boolean)).size;

    return (
        <div className="space-y-5 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold mb-1" style={{ color: DARK }}>Items Management</h1>
                    <p className="text-sm" style={{ color: MUTED }}>Manage your product catalog and SKU configurations.</p>
                </div>
                <button onClick={openAdd} className="btn-primary">
                    <Plus size={15} /> Add New SKU
                </button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Total Items',   value: items.length,                   icon: Package },
                    { label: 'Categories',    value: categories,                      icon: Tag     },
                    { label: 'Avg Lead Time', value: avgLeadTime ? `${avgLeadTime}d` : '—', icon: Clock },
                ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="glass-card p-4 flex items-center gap-3">
                        <div className="p-2 rounded-xl" style={{ background: 'rgba(168,214,143,0.15)' }}>
                            <Icon size={18} style={{ color: PISTA }} />
                        </div>
                        <div>
                            <p className="text-xl font-bold" style={{ color: DARK }}>{value}</p>
                            <p className="text-xs" style={{ color: MUTED }}>{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="glass-card overflow-hidden">
                <div className="px-5 py-3.5 flex items-center gap-3 border-b"
                    style={{ borderColor: 'rgba(168,214,143,0.2)' }}>
                    <div className="relative flex-1 max-w-sm">
                        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: MUTED }} />
                        <input type="text" placeholder="Search by name, SKU, category…"
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className="input-field" style={{ paddingLeft: 32 }} />
                    </div>
                    <span className="badge-green">{filtered.length} items</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr style={{ background: 'rgba(168,214,143,0.06)', borderBottom: '1px solid rgba(168,214,143,0.2)' }}>
                                {['SKU / ITEM', 'CATEGORY', 'BASE PRICE', 'LEAD TIME', 'ACTIONS'].map((h, i) => (
                                    <th key={h} className={`px-5 py-3 text-xs font-bold uppercase tracking-wide ${i > 0 ? 'text-right' : ''}`}
                                        style={{ color: MUTED }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="px-5 py-10 text-center text-sm" style={{ color: MUTED }}>Loading items…</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-14 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Package size={32} style={{ color: 'rgba(157,184,158,0.4)' }} />
                                            <p className="text-sm font-medium" style={{ color: MUTED }}>
                                                {searchTerm ? 'No items match your search.' : 'No items yet. Add a SKU to get started.'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(item => (
                                    <tr key={item._id}
                                        style={{ borderBottom: '1px solid rgba(168,214,143,0.1)' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(168,214,143,0.04)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <td className="px-5 py-3.5">
                                            <p className="font-semibold" style={{ color: DARK }}>{item.sku}</p>
                                            <p className="text-xs" style={{ color: MUTED }}>{item.name}</p>
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <span className="badge-beige">{item.category || 'General'}</span>
                                        </td>
                                        <td className="px-5 py-3.5 text-right font-medium" style={{ color: DARK }}>
                                            ${(item.basePrice ?? 0).toFixed(2)}
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <span className="badge-green">{item.leadTimeDays ?? 7}d</span>
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {/* ✅ Edit button */}
                                                <button onClick={() => openEdit(item)}
                                                    title="Edit item"
                                                    className="p-1.5 rounded-lg transition-colors"
                                                    style={{ color: MUTED }}
                                                    onMouseEnter={e => e.currentTarget.style.color = PISTA}
                                                    onMouseLeave={e => e.currentTarget.style.color = MUTED}>
                                                    <Pencil size={15} />
                                                </button>
                                                {/* ✅ Delete — opens custom modal, not window.confirm */}
                                                <button onClick={() => handleDeleteClick(item)}
                                                    title="Delete item"
                                                    className="p-1.5 rounded-lg transition-colors"
                                                    style={{ color: MUTED }}
                                                    onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                                                    onMouseLeave={e => e.currentTarget.style.color = MUTED}>
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Add / Edit Modal ────────────────────────────────────────────── */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: 'rgba(45,58,46,0.4)', backdropFilter: 'blur(6px)' }}>
                    <div className="glass-card w-full max-w-md shadow-2xl animate-fade-in">
                        <div className="px-6 py-4 flex items-center justify-between border-b"
                            style={{ borderColor: 'rgba(168,214,143,0.2)' }}>
                            <h3 className="font-bold text-base" style={{ color: DARK }}>
                                {editItem ? `Edit — ${editItem.sku}` : 'Add New SKU'}
                            </h3>
                            <button onClick={() => setModalOpen(false)}>
                                <X size={18} style={{ color: MUTED }} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {formError && (
                                <div className="p-3 rounded-xl text-sm"
                                    style={{ background: 'rgba(254,202,202,0.3)', color: '#991b1b', border: '1px solid rgba(252,165,165,0.4)' }}>
                                    {formError}
                                </div>
                            )}
                            {[
                                { label: 'SKU ID',    name: 'sku',      placeholder: 'e.g. SKU-1001',      type: 'text', disabled: !!editItem },
                                { label: 'Item Name', name: 'name',     placeholder: 'e.g. Wireless Mouse', type: 'text' },
                                { label: 'Category',  name: 'category', placeholder: 'e.g. Electronics',   type: 'text' },
                            ].map(f => (
                                <div key={f.name}>
                                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                                        style={{ color: MUTED }}>{f.label}</label>
                                    <input type={f.type} name={f.name} value={formData[f.name]}
                                        onChange={handleChange} placeholder={f.placeholder}
                                        disabled={f.disabled}
                                        className="input-field"
                                        style={f.disabled ? { opacity: 0.6, cursor: 'not-allowed' } : {}} />
                                </div>
                            ))}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                                        style={{ color: MUTED }}>Base Price ($)</label>
                                    <input type="number" step="0.01" name="basePrice"
                                        value={formData.basePrice} onChange={handleChange}
                                        placeholder="0.00" className="input-field" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                                        style={{ color: MUTED }}>Lead Time (Days)</label>
                                    <input type="number" name="leadTimeDays"
                                        value={formData.leadTimeDays} onChange={handleChange}
                                        className="input-field" />
                                </div>
                            </div>
                        </div>

                        <div className="px-6 pb-5 flex justify-end gap-3">
                            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
                            <button onClick={handleSave} disabled={formLoading} className="btn-primary">
                                {formLoading ? 'Saving…' : editItem ? 'Save Changes' : 'Add Item'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Confirmation Modal ────────────────────────────────── */}
            {deleteTarget && (
                <ConfirmModal
                    item={deleteTarget}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}

            {/* ── Toast ────────────────────────────────────────────────────── */}
            {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
        </div>
    );
};

export default ItemsManagement;