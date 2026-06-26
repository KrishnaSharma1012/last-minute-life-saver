import { useLocation, useNavigate } from 'react-router-dom'
import { Search, Bell, Menu, Sparkles } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

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
    <header className="h-[64px] border-b border-border bg-background/50 backdrop-blur-xl flex items-center justify-between px-4 md:px-8 shrink-0 relative z-10 w-full sticky top-0">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu size={20} />
        </Button>
        <div className="flex flex-col">
          <h2 className="text-[18px] font-bold font-heading text-foreground tracking-tight leading-none">{title}</h2>
          <span className="text-[13px] text-muted-foreground mt-1">{getGreeting()} 👋</span>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        {/* XP Badge */}
        {userProfile && (
          <div className="hidden md:flex items-center bg-card border border-border rounded-full pl-3 pr-4 py-1.5 shadow-sm">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mr-2">Lv.{userProfile.level || 1}</span>
            <span className="text-[13px] font-bold text-purple-400">{userProfile.xp || 0} XP</span>
          </div>
        )}

        <div className="relative hidden md:flex items-center w-64">
          <Search size={16} className="absolute left-3 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search tasks..."
            className="pl-9 pr-10 h-9 bg-card/50 border-border/50 focus-visible:ring-1 focus-visible:ring-purple-500 rounded-full text-[13px]"
          />
          <div className="absolute right-3 flex items-center gap-0.5">
            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          className="h-9 gap-2 border-purple-500/20 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 rounded-full px-4"
          onClick={() => navigate('/ai-chat')}
        >
          <Sparkles size={16} />
          <span className="hidden sm:inline">Ask AI</span>
        </Button>

        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground rounded-full">
          <Bell size={18} />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-background"></span>
        </Button>

        <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold overflow-hidden border-2 border-border cursor-pointer shadow-sm">
          {user?.photoURL ? (
            <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[14px]">{user?.displayName?.[0] || 'K'}</span>
          )}
        </div>
      </div>
    </header>
  )
}
