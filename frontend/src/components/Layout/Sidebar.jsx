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
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/ai-chat', icon: MessageSquareText, label: 'AI Chat' },
  { path: '/calendar', icon: CalendarDays, label: 'Calendar' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/habits', icon: Target, label: 'Habits' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <aside className="w-[260px] hidden md:flex flex-col bg-card/50 backdrop-blur-xl border-r border-border h-full p-4 gap-6 shrink-0 relative z-20">
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 mt-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-[0_0_15px_rgba(124,111,255,0.3)]">
          <Zap size={18} className="text-white fill-white" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold font-heading text-[17px] tracking-tight leading-tight text-white">LifeSaver</span>
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">AI Companion</span>
        </div>
      </div>

      {/* Quick Add */}
      <Button 
        onClick={() => navigate('/tasks/new')}
        className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 shadow-none justify-start gap-3 h-11 px-4 mt-2"
      >
        <Plus size={18} />
        <span>New Task</span>
      </Button>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 overflow-y-auto">
        <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 px-3 mb-2 mt-4">Menu</div>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-all group",
                isActive 
                  ? "bg-purple-500/15 text-purple-400" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-white"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={18} className={cn("transition-colors", isActive ? "text-purple-400" : "text-muted-foreground group-hover:text-white")} />
                <span className="flex-1">{item.label}</span>
                {item.path === '/ai-chat' && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-400 text-[10px] font-bold uppercase tracking-wide">
                    <Sparkles size={10} /> AI
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom — User + AI Status */}
      <div className="flex flex-col gap-3 mt-auto">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-white/5">
          <div className="text-xl">🧠</div>
          <div className="flex flex-col">
            <span className="text-[13px] font-semibold text-white">Gemini AI</span>
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
              Connected
            </span>
          </div>
        </div>

        {user && (
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-[13px] font-medium text-muted-foreground hover:bg-white/5 hover:text-white transition-colors w-full"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        )}
      </div>
    </aside>
  )
}
