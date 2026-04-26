import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Landing from './pages/Landing'
import MainLayout from './pages/MainLayout'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="w-10 h-10 rounded-full animate-spin" style={{ border: '3px solid var(--border)', borderTopColor: 'var(--accent)' }} />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={user ? <Navigate to="/app" /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/app" /> : <Signup />} />
      <Route path="/forgot-password" element={user ? <Navigate to="/app" /> : <ForgotPassword />} />
      <Route path="/reset-password" element={user ? <Navigate to="/app" /> : <ResetPassword />} />
      <Route path="/app/*" element={user ? <MainLayout /> : <Navigate to="/login" />} />
      <Route path="/*" element={<Navigate to={user ? "/app" : "/"} />} />
    </Routes>
  )
}

export default App
