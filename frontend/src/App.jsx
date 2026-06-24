import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Layout/Sidebar'
import TopBar from './components/Layout/TopBar'
import Dashboard from './pages/Dashboard'
import AIChat from './pages/AIChat'
import TaskInput from './pages/TaskInput'
import CalendarView from './pages/CalendarView'
import Analytics from './pages/Analytics'
import Habits from './pages/Habits'
import './App.css'

function App() {
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

export default App
