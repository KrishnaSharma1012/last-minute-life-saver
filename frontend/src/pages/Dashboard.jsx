import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Zap, Clock, CheckCircle2, Flame, TrendingUp, Plus,
  Sparkles, ChevronRight, ArrowUpRight, Timer,
  AlertTriangle, Star, Mic, Trophy,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  collection, query, where, onSnapshot,
  doc, updateDoc, serverTimestamp,
} from 'firebase/firestore'
import { db, isDemoMode } from '../config/firebase'
import { getDemoTasks, updateDemoTask } from '../data/demoStore'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

/* ───────────────────────────────────────────
   DESIGN TOKENS — priority visual config
   ─────────────────────────────────────────── */
const priorityConfig = {
  critical: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'CRITICAL', icon: '🔴', glow: 'shadow-red-500/20', accent: 'from-red-500 to-rose-600', accentSolid: 'bg-red-500' },
  high: { color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20', label: 'HIGH', icon: '🟠', glow: 'shadow-pink-500/10', accent: 'from-orange-500 to-pink-500', accentSolid: 'bg-orange-500' },
  medium: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', label: 'MEDIUM', icon: '🟡', glow: 'shadow-orange-500/10', accent: 'from-amber-500 to-orange-500', accentSolid: 'bg-amber-500' },
  low: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', label: 'LOW', icon: '🟢', glow: 'shadow-green-500/10', accent: 'from-emerald-500 to-green-500', accentSolid: 'bg-emerald-500' },
}

const XP_REWARDS = { critical: 50, high: 30, medium: 20, low: 10 }

/* ───────────────────────────────────────────
   ANIMATION VARIANTS
   ─────────────────────────────────────────── */
const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}
const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, userProfile, updateProfile } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [aiSuggestions, setAiSuggestions] = useState([])

  // Fetch tasks
  useEffect(() => {
    if (!user) return

    if (isDemoMode) {
      const activeTasks = getDemoTasks('active')
      activeTasks.sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))
      setTasks(activeTasks)
      setLoading(false)
      return
    }

    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', user.uid),
      where('status', 'in', ['pending', 'in-progress']),
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      taskList.sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))
      setTasks(taskList)
      setLoading(false)
    }, (error) => {
      console.error('Error fetching tasks:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  // AI suggestions
  useEffect(() => {
    if (tasks.length === 0) {
      setAiSuggestions([
        { icon: <Plus size={14} className="text-purple-400" />, text: 'Add your first task to get AI-powered suggestions!' },
      ])
      return
    }

    const urgentTasks = tasks.filter(t => t.priority === 'critical' || t.priority === 'high')
    const suggestions = []

    if (urgentTasks.length > 0) {
      suggestions.push({
        icon: <AlertTriangle size={14} className="text-orange-400" />,
        text: `Focus on "${urgentTasks[0].title}" first — it's your highest priority right now`,
      })
    }

    const totalHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 1), 0)
    suggestions.push({
      icon: <TrendingUp size={14} className="text-green-400" />,
      text: `You have ~${totalHours.toFixed(1)} hours of work queued. ${totalHours > 6 ? 'Consider delegating or rescheduling some tasks.' : 'Manageable! You got this.'}`,
    })

    suggestions.push({
      icon: <Flame size={14} className="text-pink-400" />,
      text: `${userProfile?.streakDays || 0} day streak! ${(userProfile?.streakDays || 0) > 5 ? 'Incredible consistency!' : 'Keep building momentum!'}`,
    })

    setAiSuggestions(suggestions)
  }, [tasks, userProfile])

  // Complete a task step
  const handleCompleteStep = useCallback(async (taskId, task) => {
    const newCompleted = (task.completedSteps || 0) + 1
    const totalSteps = task.actionSteps?.length || 1
    const isFullyDone = newCompleted >= totalSteps

    try {
      if (isDemoMode) {
        const updates = { completedSteps: newCompleted }
        if (isFullyDone) updates.status = 'completed'
        updateDemoTask(taskId, updates)
        setTasks(getDemoTasks('active').sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0)))
      } else {
        const taskRef = doc(db, 'tasks', taskId)
        const updates = { completedSteps: newCompleted, updatedAt: serverTimestamp() }
        if (isFullyDone) {
          updates.status = 'completed'
          updates.completedAt = serverTimestamp()
        }
        await updateDoc(taskRef, updates)
      }

      if (isFullyDone) {
        const xpGain = XP_REWARDS[task.priority] || 10
        const newXp = (userProfile?.xp || 0) + xpGain
        const newLevel = Math.floor(newXp / 100) + 1
        await updateProfile({
          xp: newXp,
          level: newLevel,
          tasksCompleted: (userProfile?.tasksCompleted || 0) + 1,
        })
        toast.success(`🎉 Task completed! +${xpGain} XP`)
      } else {
        toast.success('Step completed! Keep going 💪')
      }
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('Failed to update task')
    }
  }, [userProfile, updateProfile])

  const handleCompleteTask = useCallback(async (taskId, task) => {
    try {
      if (isDemoMode) {
        updateDemoTask(taskId, {
          status: 'completed',
          completedSteps: task.actionSteps?.length || 0,
        })
        setTasks(getDemoTasks('active').sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0)))
      } else {
        const taskRef = doc(db, 'tasks', taskId)
        await updateDoc(taskRef, {
          status: 'completed',
          completedSteps: task.actionSteps?.length || 0,
          completedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      }

      const xpGain = XP_REWARDS[task.priority] || 10
      const newXp = (userProfile?.xp || 0) + xpGain
      const newLevel = Math.floor(newXp / 100) + 1
      await updateProfile({
        xp: newXp,
        level: newLevel,
        tasksCompleted: (userProfile?.tasksCompleted || 0) + 1,
      })

      toast.success(`🏆 Task completed! +${xpGain} XP`)
    } catch (error) {
      console.error('Error completing task:', error)
      toast.error('Failed to complete task')
    }
  }, [userProfile, updateProfile])

  const getGreeting = () => {
    const hour = new Date().getHours()
    const name = user?.displayName?.split(' ')[0] || 'there'
    if (hour < 12) return `Good morning, ${name}`
    if (hour < 17) return `Good afternoon, ${name}`
    return `Good evening, ${name}`
  }

  const urgentTasks = tasks.filter(t => t.priority === 'critical' || t.priority === 'high')
  const completedToday = userProfile?.tasksCompleted || 0
  const streakDays = userProfile?.streakDays || 0
  const currentLevel = userProfile?.level || 1
  const currentXp = userProfile?.xp || 0
  const xpProgress = ((currentXp % 100) / 100) * 100

  const formatDeadline = (deadline) => {
    if (!deadline) return 'No deadline'
    try {
      const date = deadline.toDate ? deadline.toDate() : new Date(deadline)
      const now = new Date()
      const diffMs = date - now
      const diffHours = Math.round(diffMs / (1000 * 60 * 60))
      if (diffHours < 0) return 'Overdue!'
      if (diffHours < 1) return `${Math.round(diffMs / 60000)} min`
      if (diffHours < 24) return `${diffHours} hours`
      const diffDays = Math.round(diffHours / 24)
      return `${diffDays} day${diffDays > 1 ? 's' : ''}`
    } catch {
      return String(deadline)
    }
  }

  /* ───────────────────────────────────────────
     STAT CARDS DATA
     ─────────────────────────────────────────── */
  const statCards = [
    { icon: CheckCircle2, gradient: 'from-emerald-500/20 to-green-600/5', iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-400', borderAccent: 'hover:border-emerald-500/20', glowColor: 'hover:shadow-emerald-500/[0.08]', value: completedToday, label: 'Tasks done', trend: completedToday > 0 ? '+' + completedToday : null },
    { icon: Flame, gradient: 'from-orange-500/20 to-amber-600/5', iconBg: 'bg-orange-500/15', iconColor: 'text-orange-400', borderAccent: 'hover:border-orange-500/20', glowColor: 'hover:shadow-orange-500/[0.08]', value: streakDays, label: 'Day streak 🔥', trend: streakDays > 0 ? streakDays + 'd' : null },
    { icon: Trophy, gradient: 'from-purple-500/20 to-indigo-600/5', iconBg: 'bg-purple-500/15', iconColor: 'text-purple-400', borderAccent: 'hover:border-purple-500/20', glowColor: 'hover:shadow-purple-500/[0.08]', value: `Lv.${currentLevel}`, label: `${currentXp} XP`, trend: null },
    { icon: Timer, gradient: 'from-blue-500/20 to-cyan-600/5', iconBg: 'bg-blue-500/15', iconColor: 'text-blue-400', borderAccent: 'hover:border-blue-500/20', glowColor: 'hover:shadow-blue-500/[0.08]', value: tasks.length, label: 'Active tasks', trend: urgentTasks.length > 0 ? urgentTasks.length + ' urgent' : null },
  ]

  return (
    <motion.div
      className="flex flex-col gap-7 max-w-7xl mx-auto w-full"
      variants={stagger}
      initial="hidden"
      animate="visible"
    >
      {/* ═══════════════════════════════════════════
          DEMO MODE BANNER
          ═══════════════════════════════════════════ */}
      {isDemoMode && (
        <motion.div variants={fadeUp} className="glass-light text-purple-300 px-4 py-3 rounded-xl text-sm flex items-center gap-2 border border-purple-500/15">
          <span className="text-lg">🧪</span>
          <span><strong>Demo Mode</strong> — Using sample data. Set up Firebase to connect real data.</span>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════
          HERO SECTION — Premium AI Insight Banner
          ═══════════════════════════════════════════ */}
      <motion.div variants={fadeUp}>
        <Card className="relative overflow-hidden border-0 shadow-2xl shadow-purple-900/20">
          {/* Layered background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0f0a1e] via-[#11112a] to-[#0a0e1e]" />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/[0.08] via-blue-500/[0.04] to-cyan-500/[0.03]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(124,111,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(124,111,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />

          {/* Floating orbs */}
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-purple-500/20 blur-[80px] animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-blue-500/15 blur-[60px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
          <div className="absolute top-1/2 right-1/3 w-24 h-24 rounded-full bg-cyan-500/10 blur-[50px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />

          {/* Top gradient accent line */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

          <CardContent className="p-7 md:p-8 relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-start gap-5">
                {/* Premium AI icon */}
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/25 to-blue-500/15 flex items-center justify-center border border-purple-500/20 shadow-lg shadow-purple-500/10">
                    <Sparkles size={26} className="text-purple-300" />
                  </div>
                  <div className="absolute -inset-1 rounded-2xl bg-purple-500/10 blur-md -z-10 animate-pulse" style={{ animationDuration: '3s' }} />
                  {/* Online dot */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0f0a1e] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" style={{ animationDuration: '2s' }} />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {/* Gradient greeting */}
                  <h2 className="text-2xl md:text-[28px] font-bold font-heading leading-tight">
                    <span className="gradient-text-animated">{getGreeting()}</span>
                    <span className="ml-1.5">👋</span>
                  </h2>
                  <p className="text-sm text-muted-foreground/70 leading-relaxed max-w-xl">
                    {tasks.length > 0 ? (
                      <>
                        You have <strong className="text-foreground font-semibold">{urgentTasks.length} urgent task{urgentTasks.length !== 1 ? 's' : ''}</strong> today.
                        {tasks[0] && (
                          <> Start with "<strong className="text-foreground font-semibold">{tasks[0].title}</strong>" — it needs ~{tasks[0].estimatedHours || 1}hrs of focus.</>
                        )}
                      </>
                    ) : (
                      <>You're all clear! 🎉 Add a new task to get started with AI-powered prioritization.</>
                    )}
                  </p>

                  {/* Mini stats row inside hero */}
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/50">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{completedToday} completed</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/50">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                      <span>{urgentTasks.length} urgent</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/50">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      <span>Lv.{currentLevel}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Premium CTA button */}
              <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} className="shrink-0">
                <Button
                  onClick={() => navigate('/ai-chat')}
                  className="relative bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-500 hover:via-purple-400 hover:to-indigo-500 text-white gap-2.5 px-6 h-11 shadow-xl shadow-purple-500/25 transition-all hover:shadow-purple-500/40 group overflow-hidden"
                  id="dashboard-ask-ai-btn"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/[0.08] to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <Sparkles size={16} className="relative z-10 transition-transform group-hover:rotate-12" />
                  <span className="relative z-10 font-semibold">Ask AI for help</span>
                </Button>
              </motion.div>
            </div>
          </CardContent>

          {/* Bottom gradient accent line */}
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
        </Card>
      </motion.div>

      {/* ═══════════════════════════════════════════
          STATS ROW — Differentiated color cards
          ═══════════════════════════════════════════ */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={i}
            variants={fadeUp}
            whileHover={{ y: -3, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } }}
          >
            <Card className={cn(
              "relative overflow-hidden border-white/[0.06] transition-all duration-300",
              stat.borderAccent, stat.glowColor,
              "hover:shadow-lg"
            )}>
              {/* Unique gradient per card */}
              <div className={cn("absolute inset-0 bg-gradient-to-br opacity-60", stat.gradient)} />
              {/* Top accent line */}
              <div className={cn("absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r opacity-40", stat.gradient.replace('/20', '').replace('/5', ''))} />

              <CardContent className="p-5 flex items-center gap-4 relative z-10">
                <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-white/[0.06]", stat.iconBg)}>
                  <stat.icon size={20} className={stat.iconColor} />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[26px] font-bold font-heading leading-none tracking-tight">{stat.value}</span>
                    {stat.trend && (
                      <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", stat.iconBg, stat.iconColor)}>
                        {stat.trend}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground/50 uppercase font-semibold tracking-[0.15em] mt-1">{stat.label}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* ═══════════════════════════════════════════
          MAIN CONTENT GRID
          ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">

        {/* ── Left Column: Tasks ── */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <motion.div variants={fadeUp} className="flex items-center justify-between pb-1">
            <h3 className="text-lg font-bold flex items-center gap-2.5 font-heading">
              <div className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center">
                <Zap size={14} className="text-purple-400" />
              </div>
              AI-Prioritized Tasks
              <Badge variant="outline" className="ml-1 text-[9px] font-semibold tracking-wider glass-light border-white/[0.06] text-muted-foreground/50 px-2 py-0.5">
                {tasks.length}
              </Badge>
            </h3>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button variant="ghost" size="sm" onClick={() => navigate('/tasks/new')} className="text-muted-foreground hover:text-foreground group gap-1.5">
                <Plus size={15} className="transition-transform group-hover:rotate-90 duration-300" /> Add Task
              </Button>
            </motion.div>
          </motion.div>

          <AnimatePresence mode="popLayout">
            {loading ? (
              <motion.div key="loading" variants={fadeUp}>
                <Card className="border-dashed border-2 border-white/[0.06] bg-transparent">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
                    <p>Loading your tasks...</p>
                  </CardContent>
                </Card>
              </motion.div>
            ) : tasks.length === 0 ? (
              <motion.div key="empty" variants={fadeUp}>
                <Card className="border-dashed border-2 border-white/[0.06] bg-transparent hover:glass-light transition-all cursor-pointer group" onClick={() => navigate('/tasks/new')}>
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-4 animate-float border border-purple-500/10">
                      <Sparkles size={32} className="text-purple-400/50" />
                    </div>
                    <h4 className="text-lg font-bold mb-2 font-heading">No tasks yet</h4>
                    <p className="text-muted-foreground mb-6 max-w-sm">Add your first task and let AI break it down and prioritize it for you!</p>
                    <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-500/20">
                      <Plus size={16} className="mr-2" /> Create Task
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              tasks.map((task, index) => {
                const config = priorityConfig[task.priority] || priorityConfig.medium
                const progressPct = task.actionSteps?.length > 0
                  ? ((task.completedSteps || 0) / task.actionSteps.length) * 100
                  : 0

                return (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50, scale: 0.95 }}
                    transition={{ duration: 0.35, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Card className={cn(
                      "group overflow-hidden relative border-white/[0.06] transition-all duration-300",
                      "hover:border-white/[0.1] hover:shadow-lg hover:shadow-black/20",
                      task.priority === 'critical' && "border-red-500/15 hover:border-red-500/25 hover:shadow-red-900/10"
                    )}>
                      {/* Premium priority accent — gradient bar */}
                      <div className={cn(
                        "absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b",
                        config.accent
                      )} />

                      {/* Subtle top gradient based on priority */}
                      <div className={cn(
                        "absolute top-0 left-0 right-0 h-24 opacity-[0.03] bg-gradient-to-b pointer-events-none",
                        config.accent
                      )} />

                      {/* Critical pulse effect */}
                      {task.priority === 'critical' && (
                        <div className="absolute top-4 right-4 flex items-center gap-1.5">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 shadow-lg shadow-red-500/50" />
                          </span>
                        </div>
                      )}

                      <CardContent className="p-5 pl-6 flex flex-col gap-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex flex-col gap-2.5">
                            <div className="flex items-center gap-2.5">
                              <Badge variant="outline" className={cn(
                                "font-bold text-[9px] tracking-[0.12em] shadow-sm",
                                config.color, config.bg, config.border
                              )}>
                                {config.icon} <span className="ml-1">{config.label}</span>
                              </Badge>
                              <span className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-[0.12em]">{task.category || 'General'}</span>
                            </div>
                            <h4 className="text-[15px] font-bold leading-snug group-hover:text-purple-300 transition-colors duration-200">{task.title}</h4>
                          </div>
                          {/* Complete button */}
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCompleteTask(task.id, task)}
                              className="shrink-0 text-muted-foreground/40 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-full h-10 w-10 border border-white/[0.06] transition-all hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/10"
                              title="Mark as done"
                            >
                              <CheckCircle2 size={20} />
                            </Button>
                          </motion.div>
                        </div>

                        {/* Metadata chips */}
                        <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-medium text-muted-foreground/50">
                          <div className="flex items-center gap-1.5 glass-light px-2.5 py-1.5 rounded-lg border border-white/[0.04] hover:border-white/[0.08] transition-colors">
                            <Clock size={11} className="text-muted-foreground/40" /> Due in {formatDeadline(task.deadline)}
                          </div>
                          <div className="flex items-center gap-1.5 glass-light px-2.5 py-1.5 rounded-lg border border-white/[0.04]">
                            <Timer size={11} className="text-muted-foreground/40" /> ~{task.estimatedHours || 1}h
                          </div>
                          <div className="flex items-center gap-1.5 glass-light px-2.5 py-1.5 rounded-lg border border-white/[0.04]">
                            <Star size={11} className="text-muted-foreground/40" /> Score: {task.priorityScore || 50}
                          </div>
                        </div>

                        {/* Progress section — premium glow bar */}
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between text-[11px] font-medium">
                            <span className="text-muted-foreground/40">Progress</span>
                            <span className={cn("font-semibold", config.color)}>{task.completedSteps || 0}/{task.actionSteps?.length || 0} steps</span>
                          </div>
                          <div className="relative">
                            <Progress
                              value={progressPct}
                              className="h-[6px] bg-white/[0.04] rounded-full"
                              indicatorClassName={cn(
                                "rounded-full bg-gradient-to-r transition-all duration-700",
                                config.accent,
                                progressPct > 0 && "shadow-[0_0_12px_rgba(124,111,255,0.3)]"
                              )}
                            />
                          </div>
                        </div>

                        {/* Action steps */}
                        {task.actionSteps?.length > 0 && (
                          <div className="flex flex-col gap-2 mt-0.5 rounded-xl overflow-hidden border border-white/[0.04] bg-white/[0.015]">
                            {task.actionSteps.slice(0, 2).map((step, i) => {
                              const isDone = i < (task.completedSteps || 0)
                              return (
                                <div key={i} className={cn(
                                  "flex items-start gap-3 text-sm px-4 py-3 transition-colors",
                                  isDone ? "text-muted-foreground/30 bg-white/[0.01]" : "text-foreground/80",
                                  i < 1 && "border-b border-white/[0.03]"
                                )}>
                                  <div className="mt-0.5 shrink-0">
                                    {isDone ? (
                                      <CheckCircle2 size={15} className="text-emerald-500" />
                                    ) : (
                                      <div className="w-[15px] h-[15px] rounded-full border-2 border-muted-foreground/20 group-hover:border-purple-400/40 transition-colors" />
                                    )}
                                  </div>
                                  <span className={cn("leading-snug text-[13px]", isDone && "line-through")}>{step}</span>
                                </div>
                              )
                            })}
                            {task.actionSteps.length > 2 && (
                              <div className="px-4 py-2 border-t border-white/[0.03]">
                                <span className="text-[11px] font-semibold text-purple-400/60">+{task.actionSteps.length - 2} more steps</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Next Step / Complete button — premium gradient */}
                        {(task.completedSteps || 0) < (task.actionSteps?.length || 1) && (
                          <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                            <Button
                              variant="secondary"
                              className={cn(
                                "w-full mt-0.5 h-11 relative overflow-hidden group/btn",
                                "bg-white/[0.03] hover:bg-white/[0.06]",
                                "border border-purple-500/10 hover:border-purple-500/25",
                                "transition-all duration-300 font-semibold text-[13px]"
                              )}
                              onClick={() => handleCompleteStep(task.id, task)}
                            >
                              {/* Shimmer sweep on hover */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/[0.06] to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-500" />
                              <span className="relative z-10 flex items-center gap-1.5">
                                {(task.completedSteps || 0) < (task.actionSteps?.length || 1) - 1 ? 'Next Step' : 'Complete Task'}
                                <ChevronRight size={15} className="transition-transform group-hover/btn:translate-x-1" />
                              </span>
                            </Button>
                          </motion.div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })
            )}
          </AnimatePresence>
        </div>

        {/* ── Right Column: Widgets ── */}
        <motion.div variants={stagger} className="flex flex-col gap-5">

          {/* ── Level Progress — HERO widget ── */}
          <motion.div variants={fadeUp}>
            <Card className="relative overflow-hidden border-purple-500/10 shadow-xl shadow-purple-900/10">
              {/* Special background */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.06] via-transparent to-blue-500/[0.04]" />
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-purple-500/15 blur-[60px]" />

              {/* Top accent */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500/60 via-blue-500/40 to-cyan-500/20" />

              <CardHeader className="pb-3 border-b border-white/[0.04] px-5 pt-5 relative z-10">
                <CardTitle className="text-[14px] flex items-center gap-2 font-heading">
                  <div className="w-6 h-6 rounded-md bg-purple-500/15 flex items-center justify-center">
                    <Trophy size={13} className="text-purple-400" />
                  </div>
                  Level Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 flex flex-col gap-4 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xl font-heading">Level {currentLevel}</span>
                  <span className="text-sm font-bold gradient-text">{currentXp % 100} / 100 XP</span>
                </div>
                <div className="relative">
                  <Progress
                    value={xpProgress}
                    className="h-3 bg-white/[0.04] rounded-full"
                    indicatorClassName="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 shadow-[0_0_16px_rgba(124,111,255,0.4)] rounded-full"
                  />
                  {/* Glow underneath */}
                  <div
                    className="absolute top-1/2 left-0 h-4 bg-purple-500/20 blur-md rounded-full -z-10"
                    style={{ width: `${xpProgress}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground/40 text-center font-medium">Complete tasks to earn XP and level up! 🚀</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* ── Quick Actions ── */}
          <motion.div variants={fadeUp}>
            <Card className="glass-card border-white/[0.06]">
              <CardHeader className="pb-3 border-b border-white/[0.04] px-5 pt-5">
                <CardTitle className="text-[14px] font-heading">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-4 grid grid-cols-2 gap-3">
                {[
                  { icon: Plus, gradient: 'from-purple-500/15 to-indigo-500/10', iconColor: 'text-purple-400', label: 'Add Task', path: '/tasks/new' },
                  { icon: Sparkles, gradient: 'from-blue-500/15 to-cyan-500/10', iconColor: 'text-blue-400', label: 'Ask AI', path: '/ai-chat' },
                  { icon: Mic, gradient: 'from-emerald-500/15 to-green-500/10', iconColor: 'text-emerald-400', label: 'Voice Task', path: '/tasks/new' },
                  { icon: Clock, gradient: 'from-orange-500/15 to-amber-500/10', iconColor: 'text-orange-400', label: 'Calendar', path: '/calendar' },
                ].map((action, i) => (
                  <motion.div key={i} whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.96 }}>
                    <Button
                      variant="outline"
                      className="h-[76px] w-full flex flex-col gap-2 items-center justify-center bg-white/[0.02] hover:bg-white/[0.05] border-white/[0.06] hover:border-white/[0.12] transition-all group"
                      onClick={() => navigate(action.path)}
                    >
                      <div className={cn("w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center transition-all group-hover:scale-110 group-hover:shadow-lg border border-white/[0.06]", action.gradient)}>
                        <action.icon size={16} className={action.iconColor} />
                      </div>
                      <span className="text-[11px] font-semibold text-muted-foreground/60 group-hover:text-foreground/80 transition-colors">{action.label}</span>
                    </Button>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* ── AI Suggestions ── */}
          <motion.div variants={fadeUp}>
            <Card className="glass-card border-white/[0.06] overflow-hidden relative">
              {/* Subtle AI glow */}
              <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-purple-500/10 blur-[40px]" />

              <CardHeader className="pb-3 border-b border-white/[0.04] px-5 pt-5 relative z-10">
                <CardTitle className="text-[14px] flex items-center gap-2 font-heading">
                  <div className="w-6 h-6 rounded-md bg-purple-500/15 flex items-center justify-center">
                    <Sparkles size={12} className="text-purple-400" />
                  </div>
                  AI Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 relative z-10">
                <div className="flex flex-col divide-y divide-white/[0.04]">
                  {aiSuggestions.map((suggestion, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className="flex items-start gap-3 p-4 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="mt-0.5 shrink-0 w-7 h-7 rounded-lg glass-light border border-white/[0.06] flex items-center justify-center">{suggestion.icon}</div>
                      <span className="text-[13px] text-foreground/70 leading-relaxed">{suggestion.text}</span>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ── Upcoming Deadlines ── */}
          <motion.div variants={fadeUp}>
            <Card className="glass-card border-white/[0.06]">
              <CardHeader className="pb-3 border-b border-white/[0.04] px-5 pt-5">
                <CardTitle className="text-[14px] flex items-center gap-2 font-heading">
                  <div className="w-6 h-6 rounded-md bg-orange-500/15 flex items-center justify-center">
                    <Clock size={12} className="text-orange-400" />
                  </div>
                  Upcoming Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {tasks.length === 0 ? (
                  <div className="p-5 text-center text-[13px] text-muted-foreground/40">No upcoming deadlines</div>
                ) : (
                  <div className="flex flex-col divide-y divide-white/[0.04]">
                    {tasks.slice(0, 3).map((task, i) => {
                      const deadlineText = formatDeadline(task.deadline)
                      const isOverdue = deadlineText === 'Overdue!'
                      const isUrgent = deadlineText.includes('hour') || isOverdue
                      return (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + i * 0.08 }}
                          className="flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-colors cursor-pointer group"
                        >
                          <div className={cn(
                            "w-2.5 h-2.5 rounded-full shrink-0 shadow-sm",
                            isOverdue ? "bg-red-500 shadow-red-500/30" :
                            isUrgent ? "bg-orange-500 shadow-orange-500/30" :
                            (priorityConfig[task.priority] || priorityConfig.medium).accentSolid
                          )} />
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-[13px] font-semibold truncate group-hover:text-purple-300 transition-colors">{task.title}</span>
                            <span className={cn(
                              "text-[11px] mt-0.5 font-medium",
                              isOverdue ? "text-red-400" : isUrgent ? "text-orange-400/70" : "text-muted-foreground/40"
                            )}>{deadlineText}</span>
                          </div>
                          <ArrowUpRight size={13} className="text-muted-foreground/20 opacity-0 group-hover:opacity-100 transition-all group-hover:text-purple-400" />
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  )
}
