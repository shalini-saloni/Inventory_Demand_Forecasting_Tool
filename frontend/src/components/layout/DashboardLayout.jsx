import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard,
    Package,
    Upload as UploadIcon,
    LineChart,
    ShoppingCart,
    LogOut,
    Menu,
    X,
    Bell,
    Box
} from 'lucide-react';

const SidebarLink = ({ to, icon: Icon, children, onClick }) => (
    <NavLink
        to={to}
        onClick={onClick}
        className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200'
            }`
        }
    >
        <Icon size={20} />
        {children}
    </NavLink>
);

const DashboardLayout = () => {
    const { user, logout } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans">
            {/* Mobile menu overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:block ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="h-full flex flex-col">
                    <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-500">
                            <Box size={24} />
                            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Invenza</span>
                        </div>
                        <button
                            className="ml-auto lg:hidden text-slate-500"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                        <SidebarLink to="/dashboard" icon={LayoutDashboard} onClick={() => setMobileMenuOpen(false)}>Dashboard</SidebarLink>
                        <SidebarLink to="/items" icon={Package} onClick={() => setMobileMenuOpen(false)}>Items Management</SidebarLink>
                        <SidebarLink to="/forecast" icon={LineChart} onClick={() => setMobileMenuOpen(false)}>Forecasts</SidebarLink>
                        <SidebarLink to="/restock" icon={ShoppingCart} onClick={() => setMobileMenuOpen(false)}>Restock Alerts</SidebarLink>
                        <SidebarLink to="/upload" icon={UploadIcon} onClick={() => setMobileMenuOpen(false)}>Upload Data</SidebarLink>
                    </div>

                    <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-3 mb-4 px-2">
                            <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold uppercase">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user?.name || 'Administrator'}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                            <LogOut size={18} />
                            Logout
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
                    <button
                        className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 lg:hidden"
                        onClick={() => setMobileMenuOpen(true)}
                    >
                        <Menu size={24} />
                    </button>

                    <div className="flex-1"></div>

                    <div className="flex items-center gap-4">
                        <button className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 relative">
                            <Bell size={20} />
                            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500 border-2 border-white dark:border-slate-900"></span>
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
