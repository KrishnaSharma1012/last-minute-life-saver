import { useLocation } from 'react-router-dom'
import { Search, Bell, Menu, Sparkles } from 'lucide-react'
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
  const title = pageTitles[location.pathname] || 'Dashboard'

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
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

        <button className="topbar-ai-btn" id="quick-ai-btn">
          <Sparkles size={16} />
          <span>Ask AI</span>
        </button>

        <button className="topbar-notif-btn btn-ghost btn-icon" id="notifications-btn">
          <Bell size={18} />
          <span className="notif-dot"></span>
        </button>

        <div className="topbar-avatar" id="user-avatar">
          <span>K</span>
        </div>
      </div>
    </header>
  )
}
