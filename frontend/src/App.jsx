import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login     from './pages/Login'
import Signup    from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Upload    from './pages/Upload'
import Items     from './pages/Items'
import Forecast  from './pages/Forecast'
import Decompose from './pages/Decompose'
import Restock   from './pages/Restock'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login"  element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/upload"    element={<Upload />} />
            <Route path="/items"     element={<Items />} />
            <Route path="/forecast"  element={<Forecast />} />
            <Route path="/decompose" element={<Decompose />} />
            <Route path="/restock"   element={<Restock />} />
          </Route>

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
