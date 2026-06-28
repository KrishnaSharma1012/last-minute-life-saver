import { useLocation, useNavigate } from 'react-router-dom'
import { Search, Bell, Menu, Sparkles } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { motion } from 'framer-motion'

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
    <header className="h-[64px] border-b border-white/[0.06] glass flex items-center justify-between px-4 md:px-8 shrink-0 relative z-10 w-full sticky top-0">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="md:hidden text-muted-foreground">
          <Menu size={20} />
        </Button>
        <motion.div
          key={title}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col"
        >
          <h2 className="text-[18px] font-bold font-heading text-foreground tracking-tight leading-none">{title}</h2>
          <span className="text-[12px] text-muted-foreground/60 mt-1 font-medium">{getGreeting()} 👋</span>
        </motion.div>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        {/* XP Badge */}
        {userProfile && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="hidden md:flex items-center glass-light rounded-full pl-3 pr-4 py-1.5 gap-2"
          >
            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.15em]">Lv.{userProfile.level || 1}</span>
            <span className="text-[12px] font-bold gradient-text">{userProfile.xp || 0} XP</span>
          </motion.div>
        )}

        {/* Search */}
        <div className="relative hidden md:flex items-center w-56">
          <Search size={15} className="absolute left-3 text-muted-foreground/40" />
          <Input
            type="text"
            placeholder="Search tasks..."
            className="pl-9 pr-10 h-9 glass-light border-white/[0.06] focus-visible:ring-1 focus-visible:ring-purple-500/50 focus-visible:border-purple-500/30 rounded-full text-[12px] placeholder:text-muted-foreground/30 transition-all"
            id="topbar-search"
          />
          <div className="absolute right-3 flex items-center gap-0.5">
            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-white/[0.08] bg-white/[0.03] px-1.5 font-mono text-[9px] font-medium text-muted-foreground/40">
              <span className="text-[10px]">⌘</span>K
            </kbd>
          </div>
        </div>

        {/* Ask AI Button */}
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2 border-purple-500/20 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 hover:border-purple-500/30 rounded-full px-4 transition-all duration-300 hover:shadow-[0_0_15px_rgba(124,111,255,0.1)] group"
          onClick={() => navigate('/ai-chat')}
          id="topbar-ask-ai-btn"
        >
          <Sparkles size={15} className="transition-transform group-hover:rotate-12" />
          <span className="hidden sm:inline text-[12px] font-semibold">Ask AI</span>
        </Button>

        {/* Notification Bell */}
        <Button variant="ghost" size="icon" className="relative text-muted-foreground/60 hover:text-foreground rounded-full h-9 w-9 transition-colors" id="topbar-notifications-btn">
          <Bell size={17} />
          <span className="absolute top-1.5 right-2 w-2 h-2 bg-purple-500 rounded-full border-2 border-background animate-pulse" />
        </Button>

        {/* User Avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center font-bold overflow-hidden border-2 border-white/[0.08] cursor-pointer shadow-lg hover:shadow-purple-500/20 transition-shadow">
          {user?.photoURL ? (
            <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[13px] text-white">{user?.displayName?.[0] || 'K'}</span>
          )}
        </div>
      </div>
    </header>
  )
}
