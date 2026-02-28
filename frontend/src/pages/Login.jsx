import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';

const PISTA = '#7ec062';
const DARK  = '#2d3a2e';
const MUTED = '#9db89e';

const Login = () => {
    const [email,    setEmail]    = useState('');
    const [password, setPassword] = useState('');
    const [showPw,   setShowPw]   = useState(false);
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState('');
    const { login }   = useAuth();
    const navigate    = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const result = await login(email, password);
        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.error || 'Invalid email or password.');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #f4faf0 0%, #fdfaf5 50%, #f7f4ee 100%)' }}>
            {/* Background blobs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-30" style={{ background: 'radial-gradient(circle, rgba(126,192,98,0.35), transparent)' }} />
                <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-25" style={{ background: 'radial-gradient(circle, rgba(221,198,158,0.4), transparent)' }} />
            </div>

            <div className="relative w-full max-w-md animate-fade-in">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-lg" style={{ background: 'linear-gradient(135deg, #7ec062, #5ba63e)' }}>
                        <Box size={28} color="white" />
                    </div>
                    <h1 className="text-3xl font-bold" style={{ color: DARK }}>
                        Inven<span style={{ color: '#5ba63e' }}>za</span>
                    </h1>
                    <p className="text-sm mt-1" style={{ color: MUTED }}>Intelligent Inventory Forecasting</p>
                </div>

                {/* Card */}
                <div
                    className="rounded-2xl p-8"
                    style={{
                        background: 'rgba(253,250,245,0.9)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(168,214,143,0.3)',
                        boxShadow: '0 8px 48px rgba(91,166,62,0.1), 0 2px 8px rgba(0,0,0,0.04)',
                    }}
                >
                    <h2 className="text-xl font-bold mb-1" style={{ color: DARK }}>Welcome back</h2>
                    <p className="text-sm mb-6" style={{ color: MUTED }}>Sign in to your account</p>

                    {error && (
                        <div className="mb-5 p-3.5 rounded-xl flex items-center gap-3 text-sm" style={{ background: 'rgba(254,202,202,0.3)', border: '1px solid rgba(252,165,165,0.45)', color: '#991b1b' }}>
                            <AlertCircle size={17} style={{ flexShrink: 0 }} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: MUTED }}>Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="input-field"
                                autoComplete="email"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: MUTED }}>Password</label>
                            <div className="relative">
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="input-field pr-11"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw(!showPw)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5"
                                    style={{ color: MUTED }}
                                >
                                    {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2"
                        >
                            {loading ? (
                                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Signing in…</>
                            ) : (
                                <>Sign In <ArrowRight size={16} /></>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-sm mt-6" style={{ color: MUTED }}>
                        Don't have an account?{' '}
                        <Link to="/signup" className="font-semibold transition-colors" style={{ color: '#3d7a28' }}
                            onMouseEnter={e => e.target.style.color = PISTA}
                            onMouseLeave={e => e.target.style.color = '#3d7a28'}
                        >
                            Create one
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
