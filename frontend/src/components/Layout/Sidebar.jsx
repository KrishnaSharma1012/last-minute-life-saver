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
import { motion } from 'framer-motion'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/ai-chat', icon: MessageSquareText, label: 'AI Chat', badge: true },
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
    <aside className="w-[260px] hidden md:flex flex-col glass-strong border-r border-white/[0.06] h-full p-4 gap-5 shrink-0 relative z-20 overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-500/[0.03] via-transparent to-blue-500/[0.02] pointer-events-none" />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center gap-3 px-2 mt-2 relative z-10"
      >
        <div className="relative group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center glow-purple transition-shadow group-hover:glow-purple-strong">
            <Zap size={18} className="text-white fill-white" />
          </div>
          <div className="absolute inset-0 rounded-xl bg-purple-500/20 animate-pulse-ring pointer-events-none" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold font-heading text-[17px] tracking-tight leading-tight text-white">LifeSaver</span>
          <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.2em]">AI Companion</span>
        </div>
      </motion.div>

      {/* Quick Add */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="relative z-10"
      >
        <Button
          onClick={() => navigate('/tasks/new')}
          className="w-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 hover:border-purple-500/30 shadow-none justify-start gap-3 h-11 px-4 transition-all duration-300 hover:shadow-[0_0_15px_rgba(124,111,255,0.1)] group"
          id="sidebar-new-task-btn"
        >
          <Plus size={18} className="transition-transform group-hover:rotate-90 duration-300" />
          <span>New Task</span>
        </Button>
      </motion.div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 overflow-y-auto relative z-10 pr-1">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 px-3 mb-2 mt-3">Menu</div>
        {navItems.map((item, index) => (
          <motion.div
            key={item.path}
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + index * 0.05, duration: 0.35 }}
          >
            <NavLink
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group relative",
                  isActive
                    ? "bg-purple-500/12 text-purple-400 shadow-[0_0_15px_rgba(124,111,255,0.08)]"
                    : "text-muted-foreground hover:bg-white/[0.04] hover:text-white"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active indicator bar */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(124,111,255,0.6)]"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <item.icon
                    size={18}
                    className={cn(
                      "transition-all duration-200",
                      isActive ? "text-purple-400" : "text-muted-foreground group-hover:text-white group-hover:scale-110"
                    )}
                  />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-500/15 text-purple-400 text-[9px] font-bold uppercase tracking-wider border border-purple-500/20">
                      <Sparkles size={9} /> AI
                    </span>
                  )}
                </>
              )}
            </NavLink>
          </motion.div>
        ))}
      </nav>

      {/* Bottom — AI Status + User */}
      <div className="flex flex-col gap-3 mt-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="flex items-center gap-3 p-3 rounded-xl glass-light"
        >
          <div className="text-xl">🧠</div>
          <div className="flex flex-col">
            <span className="text-[12px] font-semibold text-white">Gemini AI</span>
            <span className="flex items-center gap-1.5 text-[10px] font-medium text-green-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
              </span>
              Connected
            </span>
          </div>
        </motion.div>

        {user && (
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-[12px] font-medium text-muted-foreground/60 hover:bg-white/[0.04] hover:text-white transition-all w-full group"
            id="sidebar-logout-btn"
          >
            <LogOut size={15} className="transition-transform group-hover:-translate-x-0.5" />
            <span>Sign Out</span>
          </button>
        )}
      </div>

      {/* Bottom gradient fade for scroll */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[hsl(var(--card))] to-transparent pointer-events-none z-[5]" />
    </aside>
  )
}
