import { useLocation, useNavigate } from 'react-router-dom'
import { Search, Bell, Menu, Sparkles } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import './TopBar.css'

const pageTitles = {
  '/': 'Dashboard',
  '/tasks/new': 'New Task',
  '/ai-chat': 'AI Chat',
  '/calendar': 'Calendar',
  '/analytics': 'Analytics',
  '/habits': 'Habits',
}

export default function TopBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, userProfile } = useAuth()
  const title = pageTitles[location.pathname] || 'Dashboard'

  const getGreeting = () => {
    const hour = new Date().getHours()
    const name = user?.displayName?.split(' ')[0] || 'there'
    if (hour < 12) return `Good morning, ${name}`
    if (hour < 17) return `Good afternoon, ${name}`
    return `Good evening, ${name}`
  }

  return (
    <header className="topbar" id="topbar">
      <div className="topbar-left">
        <button className="topbar-menu-btn btn-ghost btn-icon mobile-only" id="mobile-menu-btn">
          <Menu size={20} />
        </button>
        <div className="topbar-title-area">
          <h2 className="topbar-title">{title}</h2>
          <span className="topbar-greeting">{getGreeting()} 👋</span>
        </div>
      </div>

      <div className="topbar-right">
        {/* XP Badge */}
        {userProfile && (
          <div className="topbar-xp-badge">
            <span className="xp-level">Lv.{userProfile.level || 1}</span>
            <span className="xp-points">{userProfile.xp || 0} XP</span>
          </div>
        )}

        <div className="topbar-search">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search tasks..."
            className="search-input"
            id="global-search"
          />
          <kbd className="search-kbd">⌘K</kbd>
        </div>

        <button className="topbar-ai-btn" id="quick-ai-btn" onClick={() => navigate('/ai-chat')}>
          <Sparkles size={16} />
          <span>Ask AI</span>
        </button>

        <button className="topbar-notif-btn btn-ghost btn-icon" id="notifications-btn">
          <Bell size={18} />
          <span className="notif-dot"></span>
        </button>

        <div className="topbar-avatar" id="user-avatar">
          {user?.photoURL ? (
            <img src={user.photoURL} alt={user.displayName} className="avatar-img" />
          ) : (
            <span>{user?.displayName?.[0] || 'K'}</span>
          )}
        </div>
      </div>
    </header>
  )
}
