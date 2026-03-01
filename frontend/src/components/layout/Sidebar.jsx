import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Upload, Package, TrendingUp,
  BarChart3, ShoppingCart, LogOut, Leaf
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/upload', icon: Upload, label: 'Upload Data' },
  { to: '/items', icon: Package, label: 'Items' },
  { to: '/forecast', icon: TrendingUp, label: 'Forecast' },
  { to: '/decompose', icon: BarChart3, label: 'Decomposition' },
  { to: '/restock', icon: ShoppingCart, label: 'Restock' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <aside style={{
      position: 'fixed', top: 0, left: 0,
      width: 'var(--sidebar-w)', height: '100vh',
      background: 'var(--white)',
      borderRight: '1px solid var(--beige-border)',
      display: 'flex', flexDirection: 'column',
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: '22px 20px 20px', borderBottom: '1px solid var(--beige-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34,
            background: 'var(--pista)',
            borderRadius: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Leaf size={18} color="white" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', lineHeight: 1.1, color: 'var(--ink)' }}>
              Invenza
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--ink-light)', letterSpacing: '0.05em' }}>
              DEMAND FORECASTING
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '14px 12px', overflowY: 'auto' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--ink-light)', letterSpacing: '0.08em', padding: '6px 10px', marginBottom: 4, textTransform: 'uppercase' }}>
          Navigation
        </div>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 12px',
              borderRadius: 'var(--radius)',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: isActive ? 'var(--pista-dark)' : 'var(--ink-muted)',
              background: isActive ? 'var(--pista-50)' : 'transparent',
              textDecoration: 'none',
              transition: 'var(--transition)',
              marginBottom: 2,
            })}
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid var(--beige-border)' }}>
        <div style={{ padding: '10px 12px', marginBottom: 6, borderRadius: 'var(--radius)', background: 'var(--beige)' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.username || 'User'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="btn btn-ghost"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <LogOut size={15} /> Sign out
        </button>
      </div>
    </aside>
  )
}
