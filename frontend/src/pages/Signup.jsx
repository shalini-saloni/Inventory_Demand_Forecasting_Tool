import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Package, Lock, Mail, User, ArrowRight } from 'lucide-react';

const Signup = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        const result = await signup(name, email, password);
        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.error);
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-950">
            {/* Left side styling - Branding */}
            <div className="hidden lg:flex w-1/2 bg-blue-600 relative items-center justify-center border-r border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-800 to-blue-900 opacity-90 z-0"></div>
                <div className="absolute opacity-20 transform translate-x-1/4 translate-y-1/4 z-0">
                    <Package size={600} />
                </div>
                <div className="relative z-10 px-12 text-white">
                    <h1 className="text-5xl font-extrabold tracking-tight mb-6">Invenza</h1>
                    <p className="text-xl font-medium text-blue-100 mb-4 max-w-md">
                        Join the Supply Chain Revolution
                    </p>
                    <p className="text-blue-200 text-sm max-w-sm leading-relaxed">
                        Create an account to start analyzing sales data, forecasting demand, and reducing carrying costs globally.
                    </p>
                </div>
            </div>

            {/* Right side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
                <div className="w-full max-w-md">
                    <div className="flex items-center gap-2 mb-8 lg:hidden">
                        <div className="p-2 bg-blue-600 rounded-lg text-white">
                            <Package size={24} />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">Invenza</h1>
                    </div>

                    <div className="mb-10 text-center lg:text-left">
                        <h2 className="text-3xl font-bold mb-2">Create an account</h2>
                        <p className="text-slate-500 dark:text-slate-400">Get started with intelligent forecasting</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm border border-red-200 dark:border-red-800/50 text-center">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
                                Full Name
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <User size={18} />
                                </div>
                                <input
                                    type="text"
                                    required
                                    className="block w-full pl-10 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="block w-full pl-10 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                                    placeholder="admin@invenza.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="block w-full pl-10 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">Must be at least 6 characters.</p>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center items-center gap-2 mt-4 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {isLoading ? 'Creating account...' : 'Create account'}
                            {!isLoading && <ArrowRight size={18} />}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Already have an account? </span>
                        <Link to="/login" className="font-medium text-blue-600 dark:text-blue-500 hover:underline">
                            Sign in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
