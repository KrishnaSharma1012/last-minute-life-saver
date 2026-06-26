import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Sidebar from './components/Layout/Sidebar'
import TopBar from './components/Layout/TopBar'
import Dashboard from './pages/Dashboard'
import AIChat from './pages/AIChat'
import TaskInput from './pages/TaskInput'
import CalendarView from './pages/CalendarView'
import Analytics from './pages/Analytics'
import Habits from './pages/Habits'
import Login from './pages/Login'
import './App.css'

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
        <p>Loading your workspace...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

function AppLayout() {
  return (
    <div className="app-layout">
      <div className="bg-grid" />
      <Sidebar />
      <div className="main-area">
        <TopBar />
        <div className="page-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks/new" element={<TaskInput />} />
            <Route path="/ai-chat" element={<AIChat />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/habits" element={<Habits />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

// Redirect to dashboard if already logged in
function LoginRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
      </div>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return <Login />
}

export default App
