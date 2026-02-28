import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

const DARK  = '#2d3a2e';
const MUTED = '#9db89e';
const PISTA = '#7ec062';

const Signup = () => {
    const [name,     setName]     = useState('');
    const [email,    setEmail]    = useState('');
    const [password, setPassword] = useState('');
    const [showPw,   setShowPw]   = useState(false);
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState('');
    const { signup } = useAuth();
    const navigate   = useNavigate();

    const pwStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
    const pwColors   = ['', '#e85656', '#e8924a', PISTA];
    const pwLabels   = ['', 'Weak', 'Fair', 'Strong'];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const result = await signup(name, email, password);
        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.error || 'Signup failed. Please try again.');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #f4faf0 0%, #fdfaf5 50%, #f7f4ee 100%)' }}>
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-30" style={{ background: 'radial-gradient(circle, rgba(221,198,158,0.4), transparent)' }} />
                <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-25" style={{ background: 'radial-gradient(circle, rgba(126,192,98,0.35), transparent)' }} />
            </div>

            <div className="relative w-full max-w-md animate-fade-in">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-lg" style={{ background: 'linear-gradient(135deg, #7ec062, #5ba63e)' }}>
                        <Box size={28} color="white" />
                    </div>
                    <h1 className="text-3xl font-bold" style={{ color: DARK }}>
                        Inven<span style={{ color: '#5ba63e' }}>za</span>
                    </h1>
                    <p className="text-sm mt-1" style={{ color: MUTED }}>Create your account</p>
                </div>

                <div className="rounded-2xl p-8" style={{
                    background: 'rgba(253,250,245,0.9)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(168,214,143,0.3)',
                    boxShadow: '0 8px 48px rgba(91,166,62,0.1), 0 2px 8px rgba(0,0,0,0.04)',
                }}>
                    <h2 className="text-xl font-bold mb-1" style={{ color: DARK }}>Get started</h2>
                    <p className="text-sm mb-6" style={{ color: MUTED }}>Fill in your details below</p>

                    {error && (
                        <div className="mb-5 p-3.5 rounded-xl flex items-center gap-3 text-sm" style={{ background: 'rgba(254,202,202,0.3)', border: '1px solid rgba(252,165,165,0.45)', color: '#991b1b' }}>
                            <AlertCircle size={17} style={{ flexShrink: 0 }} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: MUTED }}>Full Name</label>
                            <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" className="input-field" autoComplete="name" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: MUTED }}>Email</label>
                            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="input-field" autoComplete="email" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: MUTED }}>Password</label>
                            <div className="relative">
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    required
                                    minLength={6}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Min. 6 characters"
                                    className="input-field pr-11"
                                    autoComplete="new-password"
                                />
                                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5" style={{ color: MUTED }}>
                                    {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                                </button>
                            </div>
                            {/* Strength bar */}
                            {password.length > 0 && (
                                <div className="mt-2 flex items-center gap-2">
                                    <div className="flex gap-1 flex-1">
                                        {[1,2,3].map(i => (
                                            <div key={i} className="h-1.5 flex-1 rounded-full transition-all duration-300"
                                                style={{ background: i <= pwStrength ? pwColors[pwStrength] : 'rgba(168,214,143,0.2)' }} />
                                        ))}
                                    </div>
                                    <span className="text-xs font-semibold" style={{ color: pwColors[pwStrength] }}>{pwLabels[pwStrength]}</span>
                                </div>
                            )}
                        </div>

                        {/* Feature bullets */}
                        <div className="rounded-xl p-3.5" style={{ background: 'rgba(168,214,143,0.08)', border: '1px solid rgba(168,214,143,0.2)' }}>
                            {['ML-powered demand forecasting', 'Automated restock recommendations', 'Real-time inventory insights'].map(f => (
                                <div key={f} className="flex items-center gap-2 text-xs py-0.5">
                                    <CheckCircle2 size={13} style={{ color: PISTA, flexShrink: 0 }} />
                                    <span style={{ color: '#4a6a4b' }}>{f}</span>
                                </div>
                            ))}
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2">
                            {loading
                                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Creating account…</>
                                : <>Create Account <ArrowRight size={16} /></>
                            }
                        </button>
                    </form>

                    <p className="text-center text-sm mt-6" style={{ color: MUTED }}>
                        Already have an account?{' '}
                        <Link to="/login" className="font-semibold" style={{ color: '#3d7a28' }}
                            onMouseEnter={e => e.target.style.color = PISTA}
                            onMouseLeave={e => e.target.style.color = '#3d7a28'}
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
