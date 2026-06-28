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

const priorityConfig = {
  critical: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'CRITICAL', icon: '🔴', glow: 'shadow-red-500/20' },
  high: { color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20', label: 'HIGH', icon: '🟠', glow: 'shadow-pink-500/10' },
  medium: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', label: 'MEDIUM', icon: '🟡', glow: 'shadow-orange-500/10' },
  low: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', label: 'LOW', icon: '🟢', glow: 'shadow-green-500/10' },
}

const XP_REWARDS = { critical: 50, high: 30, medium: 20, low: 10 }

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
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

  const statCards = [
    { icon: CheckCircle2, color: 'green', value: completedToday, label: 'Tasks done' },
    { icon: Flame, color: 'orange', value: streakDays, label: 'Day streak 🔥' },
    { icon: Trophy, color: 'purple', value: `Lv.${currentLevel}`, label: `${currentXp} XP` },
    { icon: Timer, color: 'blue', value: tasks.length, label: 'Active tasks' },
  ]

  const colorClasses = {
    green: { bg: 'bg-green-500/10', text: 'text-green-500' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-500' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-500' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
  }

  return (
    <motion.div
      className="flex flex-col gap-6 max-w-7xl mx-auto w-full"
      variants={stagger}
      initial="hidden"
      animate="visible"
    >
      {/* Demo Mode Banner */}
      {isDemoMode && (
        <motion.div variants={fadeUp} className="glass-light text-purple-300 px-4 py-3 rounded-xl text-sm flex items-center gap-2 border border-purple-500/15">
          <span className="text-lg">🧪</span>
          <span><strong>Demo Mode</strong> — Using sample data. Set up Firebase to connect real data.</span>
        </motion.div>
      )}

      {/* AI Insight Banner */}
      <motion.div variants={fadeUp}>
        <Card className="relative overflow-hidden glass-card border-purple-500/20">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/[0.07] via-blue-500/[0.04] to-transparent z-0" />
          <div className="absolute -top-20 -right-20 w-60 h-60 orb-purple opacity-30" />
          <CardContent className="p-6 relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/15 flex items-center justify-center shrink-0 glow-purple border border-purple-500/20">
                <Sparkles size={24} className="text-purple-400" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-lg font-bold text-foreground mb-1 font-heading">{getGreeting()}! 👋</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                  {tasks.length > 0 ? (
                    <>
                      You have <strong className="text-foreground">{urgentTasks.length} urgent task{urgentTasks.length !== 1 ? 's' : ''}</strong> today.
                      {tasks[0] && (
                        <> Start with "<strong className="text-foreground">{tasks[0].title}</strong>" — it needs ~{tasks[0].estimatedHours || 1}hrs of focus.</>
                      )}
                    </>
                  ) : (
                    <>You're all clear! 🎉 Add a new task to get started with AI-powered prioritization.</>
                  )}
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/ai-chat')}
              className="bg-purple-600 hover:bg-purple-700 text-white gap-2 shrink-0 shadow-lg shadow-purple-500/20 transition-all hover:shadow-purple-500/30 hover:-translate-y-0.5 group"
              id="dashboard-ask-ai-btn"
            >
              <Sparkles size={16} className="transition-transform group-hover:rotate-12" />
              Ask AI for help
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Row */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, i) => {
          const c = colorClasses[stat.color]
          return (
            <motion.div
              key={i}
              variants={fadeUp}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
            >
              <Card className="glass-card card-hover border-white/[0.05]">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", c.bg)}>
                    <stat.icon size={20} className={c.text} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold font-heading">{stat.value}</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-[0.15em]">{stat.label}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Tasks */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <motion.div variants={fadeUp} className="flex items-center justify-between pb-2">
            <h3 className="text-lg font-bold flex items-center gap-2 font-heading">
              <Zap size={18} className="text-purple-400" />
              AI-Prioritized Tasks
            </h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/tasks/new')} className="text-muted-foreground hover:text-foreground group">
              <Plus size={16} className="mr-1 transition-transform group-hover:rotate-90" /> Add Task
            </Button>
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
                <Card className="border-dashed border-2 border-white/[0.06] bg-transparent hover:glass-light transition-all cursor-pointer" onClick={() => navigate('/tasks/new')}>
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4 animate-float">
                      <Sparkles size={32} className="text-purple-400/50" />
                    </div>
                    <h4 className="text-lg font-bold mb-2 font-heading">No tasks yet</h4>
                    <p className="text-muted-foreground mb-6 max-w-sm">Add your first task and let AI break it down and prioritize it for you!</p>
                    <Button className="bg-purple-600 hover:bg-purple-700">
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
                      "group overflow-hidden glass-card card-hover relative border-white/[0.05]",
                      task.priority === 'critical' && "border-red-500/15"
                    )}>
                      {/* Priority accent bar */}
                      <div className={cn("absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg", config.bg.replace('/10', ''))} />

                      {/* Critical pulse effect */}
                      {task.priority === 'critical' && (
                        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-500/50" />
                      )}

                      <CardContent className="p-5 pl-6 flex flex-col gap-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={cn("font-bold text-[9px] tracking-[0.12em]", config.color, config.bg, config.border)}>
                                {config.icon} <span className="ml-1">{config.label}</span>
                              </Badge>
                              <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.12em]">{task.category || 'General'}</span>
                            </div>
                            <h4 className="text-base font-bold leading-tight group-hover:text-purple-400 transition-colors">{task.title}</h4>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCompleteTask(task.id, task)}
                            className="shrink-0 text-muted-foreground hover:text-green-500 hover:bg-green-500/10 rounded-full h-10 w-10 border border-white/[0.06] transition-all hover:scale-110 hover:border-green-500/30"
                            title="Mark as done"
                          >
                            <CheckCircle2 size={20} />
                          </Button>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-muted-foreground/60">
                          <div className="flex items-center gap-1.5 glass-light px-2.5 py-1 rounded-md">
                            <Clock size={12} /> Due in {formatDeadline(task.deadline)}
                          </div>
                          <div className="flex items-center gap-1.5 glass-light px-2.5 py-1 rounded-md">
                            <Timer size={12} /> ~{task.estimatedHours || 1}h
                          </div>
                          <div className="flex items-center gap-1.5 glass-light px-2.5 py-1 rounded-md">
                            <Star size={12} /> Score: {task.priorityScore || 50}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 mt-1">
                          <div className="flex items-center justify-between text-[11px] font-medium">
                            <span className="text-muted-foreground/50">Progress</span>
                            <span className={config.color}>{task.completedSteps || 0}/{task.actionSteps?.length || 0} steps</span>
                          </div>
                          <Progress value={progressPct} className="h-1.5 bg-white/[0.04]" indicatorClassName={cn("transition-all duration-500", config.bg.replace('/10', ''))} />
                        </div>

                        {task.actionSteps?.length > 0 && (
                          <div className="flex flex-col gap-2 mt-1 glass-light rounded-lg p-3">
                            {task.actionSteps.slice(0, 2).map((step, i) => {
                              const isDone = i < (task.completedSteps || 0)
                              return (
                                <div key={i} className={cn("flex items-start gap-2.5 text-sm", isDone ? "text-muted-foreground/40 line-through" : "text-foreground")}>
                                  <div className="mt-0.5 shrink-0">
                                    {isDone ? (
                                      <CheckCircle2 size={15} className="text-green-500" />
                                    ) : (
                                      <div className="w-[15px] h-[15px] rounded-full border-2 border-muted-foreground/30" />
                                    )}
                                  </div>
                                  <span className="leading-snug text-[13px]">{step}</span>
                                </div>
                              )
                            })}
                            {task.actionSteps.length > 2 && (
                              <span className="text-[11px] font-semibold text-purple-400/70 mt-1 pl-6">+{task.actionSteps.length - 2} more steps</span>
                            )}
                          </div>
                        )}

                        {(task.completedSteps || 0) < (task.actionSteps?.length || 1) && (
                          <Button
                            variant="secondary"
                            className="w-full mt-1 glass-light hover:bg-purple-500/10 border border-purple-500/10 hover:border-purple-500/20 transition-all group"
                            onClick={() => handleCompleteStep(task.id, task)}
                          >
                            {(task.completedSteps || 0) < (task.actionSteps?.length || 1) - 1 ? 'Next Step' : 'Complete Task'}
                            <ChevronRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Widgets */}
        <motion.div variants={stagger} className="flex flex-col gap-5">
          {/* Level Progress */}
          <motion.div variants={fadeUp}>
            <Card className="glass-card border-white/[0.05] overflow-hidden relative">
              <div className="absolute -top-10 -right-10 w-32 h-32 orb-purple opacity-20" />
              <CardHeader className="pb-3 border-b border-white/[0.04] px-5 pt-5">
                <CardTitle className="text-[14px] flex items-center gap-2 font-heading">
                  <Trophy size={15} className="text-purple-400" /> Level Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 flex flex-col gap-4 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-lg font-heading">Level {currentLevel}</span>
                  <span className="text-sm font-semibold gradient-text">{currentXp % 100} / 100 XP</span>
                </div>
                <Progress value={xpProgress} className="h-2.5 bg-white/[0.04]" indicatorClassName="bg-gradient-to-r from-purple-500 to-blue-500 shadow-[0_0_12px_rgba(124,111,255,0.4)]" />
                <p className="text-[11px] text-muted-foreground/50 text-center">Complete tasks to earn XP and level up! 🚀</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={fadeUp}>
            <Card className="glass-card border-white/[0.05]">
              <CardHeader className="pb-3 border-b border-white/[0.04] px-5 pt-5">
                <CardTitle className="text-[14px] font-heading">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-4 grid grid-cols-2 gap-3">
                {[
                  { icon: Plus, color: 'purple', label: 'Add Task', path: '/tasks/new' },
                  { icon: Sparkles, color: 'blue', label: 'Ask AI', path: '/ai-chat' },
                  { icon: Mic, color: 'green', label: 'Voice Task', path: '/tasks/new' },
                  { icon: Clock, color: 'orange', label: 'Calendar', path: '/calendar' },
                ].map((action, i) => {
                  const c = colorClasses[action.color]
                  return (
                    <motion.div key={i} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
                      <Button
                        variant="outline"
                        className="h-20 w-full flex flex-col gap-2 items-center justify-center glass-light hover:bg-white/[0.04] border-white/[0.05] hover:border-white/[0.1] transition-all group"
                        onClick={() => navigate(action.path)}
                      >
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover:scale-110", c.bg)}>
                          <action.icon size={15} className={c.text} />
                        </div>
                        <span className="text-[11px] font-medium">{action.label}</span>
                      </Button>
                    </motion.div>
                  )
                })}
              </CardContent>
            </Card>
          </motion.div>

          {/* AI Suggestions */}
          <motion.div variants={fadeUp}>
            <Card className="glass-card border-white/[0.05]">
              <CardHeader className="pb-3 border-b border-white/[0.04] px-5 pt-5">
                <CardTitle className="text-[14px] flex items-center gap-2 font-heading">
                  <Sparkles size={15} className="text-purple-400" /> AI Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex flex-col divide-y divide-white/[0.04]">
                  {aiSuggestions.map((suggestion, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 hover:bg-white/[0.02] transition-colors">
                      <div className="mt-0.5 shrink-0 glass-light rounded-full p-1.5">{suggestion.icon}</div>
                      <span className="text-[13px] text-foreground/80 leading-snug">{suggestion.text}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Upcoming Deadlines */}
          <motion.div variants={fadeUp}>
            <Card className="glass-card border-white/[0.05]">
              <CardHeader className="pb-3 border-b border-white/[0.04] px-5 pt-5">
                <CardTitle className="text-[14px] flex items-center gap-2 font-heading">
                  <Clock size={15} className="text-orange-400" /> Upcoming Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {tasks.length === 0 ? (
                  <div className="p-5 text-center text-[13px] text-muted-foreground/50">No upcoming deadlines</div>
                ) : (
                  <div className="flex flex-col divide-y divide-white/[0.04]">
                    {tasks.slice(0, 3).map((task) => (
                      <div key={task.id} className="flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-colors cursor-pointer group">
                        <div className={cn("w-2 h-2 rounded-full shrink-0", (priorityConfig[task.priority] || priorityConfig.medium).bg.replace('/10', ''))} />
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-[13px] font-semibold truncate group-hover:text-purple-400 transition-colors">{task.title}</span>
                          <span className="text-[11px] text-muted-foreground/50 mt-0.5">{formatDeadline(task.deadline)}</span>
                        </div>
                        <ArrowUpRight size={13} className="text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))}
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
