import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  MessageSquareText,
  CalendarDays,
  BarChart3,
  Target,
  Plus,
  Zap,
  Sparkles,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import './Sidebar.css'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/ai-chat', icon: MessageSquareText, label: 'AI Chat' },
  { path: '/calendar', icon: CalendarDays, label: 'Calendar' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/habits', icon: Target, label: 'Habits' },
]

export default function Sidebar() {
  const { user, userProfile, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <aside className="sidebar" id="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">
          <Zap size={20} />
        </div>
        <div className="logo-text">
          <span className="logo-title">LifeSaver</span>
          <span className="logo-subtitle">AI Companion</span>
        </div>
      </div>

      {/* Quick Add */}
      <NavLink to="/tasks/new" className="sidebar-add-btn">
        <Plus size={18} />
        <span>New Task</span>
      </NavLink>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Menu</div>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'nav-item-active' : ''}`
            }
          >
            <item.icon size={18} />
            <span>{item.label}</span>
            {item.path === '/ai-chat' && (
              <span className="nav-badge badge-purple">
                <Sparkles size={10} /> AI
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom — User + AI Status */}
      <div className="sidebar-bottom">
        <div className="sidebar-ai-card">
          <div className="ai-card-icon">🧠</div>
          <div className="ai-card-text">
            <span className="ai-card-title">Gemini AI</span>
            <span className="ai-card-status">
              <span className="status-dot"></span>
              Connected
            </span>
          </div>
        </div>

        {user && (
          <button className="sidebar-logout-btn" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        )}
      </div>
    </aside>
  )
}
