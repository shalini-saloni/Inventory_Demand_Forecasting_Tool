import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
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
    Box,
    ChevronRight
} from 'lucide-react';

const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/items',     icon: Package,          label: 'Items'     },
    { to: '/forecast',  icon: LineChart,         label: 'Forecasts' },
    { to: '/restock',   icon: ShoppingCart,      label: 'Restock'   },
    { to: '/upload',    icon: UploadIcon,        label: 'Upload'    },
];

const SidebarLink = ({ to, icon: Icon, label, onClick }) => (
    <NavLink
        to={to}
        onClick={onClick}
        className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                isActive
                    ? 'bg-gradient-to-r from-[rgba(126,192,98,0.18)] to-[rgba(168,214,143,0.1)] text-[#2d5a1e] font-semibold shadow-sm border border-[rgba(126,192,98,0.25)]'
                    : 'text-[#5a6b5b] hover:bg-[rgba(168,214,143,0.1)] hover:text-[#2d5a1e]'
            }`
        }
    >
        {({ isActive }) => (
            <>
                <div className={`p-1.5 rounded-lg transition-all ${isActive ? 'bg-[rgba(126,192,98,0.2)] text-[#3d7a28]' : 'text-[#7a9a7b] group-hover:text-[#4a7a3a]'}`}>
                    <Icon size={17} />
                </div>
                <span>{label}</span>
                {isActive && <ChevronRight size={14} className="ml-auto text-[#7ec062]" />}
            </>
        )}
    </NavLink>
);

const DashboardLayout = () => {
    const { user, logout } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();

    const pageTitle = navItems.find(n => location.pathname.startsWith(n.to))?.label || 'Invenza';

    return (
        <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #f4faf0 0%, #fdfaf5 50%, #f7f4ee 100%)' }}>
            {/* Mobile overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 lg:hidden"
                    style={{ background: 'rgba(45, 58, 46, 0.4)', backdropFilter: 'blur(2px)' }}
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:block ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
                style={{
                    background: 'rgba(253, 250, 245, 0.95)',
                    backdropFilter: 'blur(20px)',
                    borderRight: '1px solid rgba(168, 214, 143, 0.35)',
                    boxShadow: '4px 0 24px rgba(91, 166, 62, 0.06)',
                }}
            >
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className="h-16 flex items-center px-5 border-b" style={{ borderColor: 'rgba(168, 214, 143, 0.3)' }}>
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg, #7ec062, #5ba63e)' }}>
                                <Box size={18} color="white" />
                            </div>
                            <span className="text-xl font-bold" style={{ color: '#2d3a2e', letterSpacing: '-0.5px' }}>
                                Inven<span style={{ color: '#5ba63e' }}>za</span>
                            </span>
                        </div>
                        <button
                            className="ml-auto lg:hidden p-1 rounded-lg transition-colors"
                            style={{ color: '#7a9a7b' }}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Nav Label */}
                    <div className="px-5 pt-5 pb-2">
                        <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#9db89e' }}>Navigation</span>
                    </div>

                    {/* Nav Links */}
                    <nav className="flex-1 overflow-y-auto px-3 space-y-1">
                        {navItems.map(item => (
                            <SidebarLink
                                key={item.to}
                                to={item.to}
                                icon={item.icon}
                                label={item.label}
                                onClick={() => setMobileMenuOpen(false)}
                            />
                        ))}
                    </nav>

                    {/* User Footer */}
                    <div className="p-4 border-t" style={{ borderColor: 'rgba(168, 214, 143, 0.25)' }}>
                        <div className="flex items-center gap-3 p-3 rounded-xl mb-3" style={{ background: 'rgba(168, 214, 143, 0.1)', border: '1px solid rgba(168, 214, 143, 0.2)' }}>
                            <div className="h-9 w-9 rounded-xl flex items-center justify-center text-white font-bold text-sm uppercase flex-shrink-0" style={{ background: 'linear-gradient(135deg, #7ec062, #4a8f30)' }}>
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                            <div className="overflow-hidden flex-1">
                                <p className="text-sm font-semibold truncate" style={{ color: '#2d3a2e' }}>{user?.name || 'User'}</p>
                                <p className="text-xs truncate" style={{ color: '#9db89e' }}>{user?.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                            style={{ color: '#7a9a7b' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(254, 202, 202, 0.4)'; e.currentTarget.style.color = '#991b1b'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#7a9a7b'; }}
                        >
                            <LogOut size={16} />
                            Sign Out
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Header */}
                <header
                    className="h-16 flex items-center px-4 sm:px-6 gap-4 sticky top-0 z-30"
                    style={{
                        background: 'rgba(253, 250, 245, 0.88)',
                        backdropFilter: 'blur(16px)',
                        borderBottom: '1px solid rgba(168, 214, 143, 0.25)',
                        boxShadow: '0 1px 12px rgba(91, 166, 62, 0.05)',
                    }}
                >
                    <button
                        className="lg:hidden p-2 rounded-xl transition-colors"
                        style={{ color: '#7a9a7b', background: 'rgba(168, 214, 143, 0.1)' }}
                        onClick={() => setMobileMenuOpen(true)}
                    >
                        <Menu size={20} />
                    </button>

                    <div className="flex-1">
                        <h2 className="text-base font-bold" style={{ color: '#2d3a2e' }}>{pageTitle}</h2>
                    </div>

                    <button
                        className="relative p-2 rounded-xl transition-all"
                        style={{ color: '#7a9a7b', background: 'rgba(168, 214, 143, 0.1)', border: '1px solid rgba(168, 214, 143, 0.2)' }}
                        title="Notifications"
                    >
                        <Bell size={18} />
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full" style={{ background: '#e85656', boxShadow: '0 0 0 2px rgba(253, 250, 245, 0.9)' }}></span>
                    </button>

                    <div className="h-9 w-9 rounded-xl flex items-center justify-center text-white text-xs font-bold uppercase" style={{ background: 'linear-gradient(135deg, #7ec062, #4a8f30)' }}>
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4 sm:p-6">
                    <div className="max-w-7xl mx-auto animate-fade-in">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
