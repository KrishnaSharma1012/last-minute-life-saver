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

const priorityConfig = {
  critical: { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'CRITICAL', icon: '🔴' },
  high: { color: 'text-pink-500', bg: 'bg-pink-500/10', border: 'border-pink-500/20', label: 'HIGH', icon: '🟠' },
  medium: { color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20', label: 'MEDIUM', icon: '🟡' },
  low: { color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20', label: 'LOW', icon: '🟢' },
}

const XP_REWARDS = { critical: 50, high: 30, medium: 20, low: 10 }

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

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Demo Mode Banner */}
      {isDemoMode && (
        <div className="bg-purple-500/10 border border-purple-500/20 text-purple-200 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-fade-up">
          <span className="text-lg">🧪</span> 
          <span><strong>Demo Mode</strong> — Using sample data. Set up Firebase to connect real data.</span>
        </div>
      )}

      {/* AI Insight Banner */}
      <Card className="relative overflow-hidden border-purple-500/30 bg-card/50 backdrop-blur animate-fade-up">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/5 z-0"></div>
        <CardContent className="p-6 relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(124,111,255,0.2)]">
              <Sparkles size={24} className="text-purple-400" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-foreground mb-1">{getGreeting()}! 👋</h3>
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
          <Button onClick={() => navigate('/ai-chat')} className="bg-purple-600 hover:bg-purple-700 text-white gap-2 shrink-0 shadow-lg shadow-purple-500/20">
            <Sparkles size={16} />
            Ask AI for help
          </Button>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur animate-fade-up border-border/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
              <CheckCircle2 size={20} className="text-green-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold font-heading">{completedToday}</span>
              <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Tasks done</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur animate-fade-up delay-75 border-border/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
              <Flame size={20} className="text-orange-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold font-heading">{streakDays}</span>
              <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Day streak 🔥</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur animate-fade-up delay-150 border-border/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
              <Trophy size={20} className="text-purple-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold font-heading">Lv.{currentLevel}</span>
              <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">{currentXp} XP</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur animate-fade-up delay-200 border-border/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <Timer size={20} className="text-blue-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold font-heading">{tasks.length}</span>
              <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Active tasks</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Tasks */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Zap size={18} className="text-purple-400" />
              AI-Prioritized Tasks
            </h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/tasks/new')} className="text-muted-foreground hover:text-foreground">
              <Plus size={16} className="mr-1" /> Add Task
            </Button>
          </div>

          <div className="flex flex-col gap-4">
            {loading ? (
              <Card className="border-dashed border-2 bg-transparent">
                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-4">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
                  <p>Loading your tasks...</p>
                </CardContent>
              </Card>
            ) : tasks.length === 0 ? (
              <Card className="border-dashed border-2 bg-transparent hover:bg-card/50 transition-colors">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
                    <Sparkles size={32} className="text-purple-400/50" />
                  </div>
                  <h4 className="text-lg font-bold mb-2">No tasks yet</h4>
                  <p className="text-muted-foreground mb-6 max-w-sm">Add your first task and let AI break it down and prioritize it for you!</p>
                  <Button onClick={() => navigate('/tasks/new')} className="bg-purple-600 hover:bg-purple-700">
                    <Plus size={16} className="mr-2" /> Create Task
                  </Button>
                </CardContent>
              </Card>
            ) : (
              tasks.map((task, index) => {
                const config = priorityConfig[task.priority] || priorityConfig.medium
                const progressPct = task.actionSteps?.length > 0
                  ? ((task.completedSteps || 0) / task.actionSteps.length) * 100
                  : 0

                return (
                  <Card 
                    key={task.id} 
                    className={cn(
                      "group overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-card/80 backdrop-blur border-border/50 relative",
                      `animate-fade-up delay-${Math.min(index * 75, 300)}`
                    )}
                  >
                    <div className={cn("absolute left-0 top-0 bottom-0 w-1 opacity-50", config.bg.replace('/10', ''))} />
                    
                    <CardContent className="p-5 flex flex-col gap-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={cn("font-bold text-[10px] tracking-wider", config.color, config.bg, config.border)}>
                              {config.icon} <span className="ml-1">{config.label}</span>
                            </Badge>
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{task.category || 'General'}</span>
                          </div>
                          <h4 className="text-lg font-bold leading-tight group-hover:text-purple-400 transition-colors">{task.title}</h4>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleCompleteTask(task.id, task)}
                          className="shrink-0 text-muted-foreground hover:text-green-500 hover:bg-green-500/10 rounded-full h-10 w-10 border border-border/50"
                          title="Mark as done"
                        >
                          <CheckCircle2 size={20} />
                        </Button>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground">
                        <div className="flex items-center gap-1.5 bg-background/50 px-2.5 py-1 rounded-md border border-border/50">
                          <Clock size={14} /> Due in {formatDeadline(task.deadline)}
                        </div>
                        <div className="flex items-center gap-1.5 bg-background/50 px-2.5 py-1 rounded-md border border-border/50">
                          <Timer size={14} /> ~{task.estimatedHours || 1}h
                        </div>
                        <div className="flex items-center gap-1.5 bg-background/50 px-2.5 py-1 rounded-md border border-border/50">
                          <Star size={14} /> Score: {task.priorityScore || 50}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 mt-1">
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span className="text-muted-foreground">Progress</span>
                          <span className={config.color}>{task.completedSteps || 0}/{task.actionSteps?.length || 0} steps</span>
                        </div>
                        <Progress value={progressPct} className="h-2 bg-muted" indicatorClassName={config.bg.replace('/10', '')} />
                      </div>

                      {task.actionSteps?.length > 0 && (
                        <div className="flex flex-col gap-2 mt-2 bg-background/50 rounded-lg p-3 border border-border/50">
                          {task.actionSteps.slice(0, 2).map((step, i) => {
                            const isDone = i < (task.completedSteps || 0)
                            return (
                              <div key={i} className={cn("flex items-start gap-2.5 text-sm", isDone ? "text-muted-foreground line-through opacity-70" : "text-foreground")}>
                                <div className="mt-0.5 shrink-0">
                                  {isDone ? (
                                    <CheckCircle2 size={16} className="text-green-500" />
                                  ) : (
                                    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/50" />
                                  )}
                                </div>
                                <span className="leading-snug">{step}</span>
                              </div>
                            )
                          })}
                          {task.actionSteps.length > 2 && (
                            <span className="text-xs font-semibold text-purple-400 mt-1 pl-6">+{task.actionSteps.length - 2} more steps</span>
                          )}
                        </div>
                      )}

                      {(task.completedSteps || 0) < (task.actionSteps?.length || 1) && (
                        <Button 
                          variant="secondary" 
                          className="w-full mt-2 bg-primary/5 hover:bg-primary/10 border border-primary/10"
                          onClick={() => handleCompleteStep(task.id, task)}
                        >
                          {(task.completedSteps || 0) < (task.actionSteps?.length || 1) - 1 ? 'Next Step' : 'Complete Task'} 
                          <ChevronRight size={16} className="ml-1" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </div>

        {/* Right Column: Widgets */}
        <div className="flex flex-col gap-6">
          <Card className="bg-card/50 backdrop-blur border-border/50 animate-fade-up delay-75">
            <CardHeader className="pb-3 border-b border-border/50 px-5 pt-5">
              <CardTitle className="text-[15px] flex items-center gap-2">
                <Trophy size={16} className="text-purple-400" /> Level Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-lg">Level {currentLevel}</span>
                <span className="text-sm font-semibold text-purple-400">{currentXp % 100} / 100 XP</span>
              </div>
              <Progress value={xpProgress} className="h-3 bg-muted" indicatorClassName="bg-gradient-to-r from-purple-500 to-blue-500" />
              <p className="text-xs text-muted-foreground text-center mt-1">Complete tasks to earn XP and level up! 🚀</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border/50 animate-fade-up delay-150">
            <CardHeader className="pb-3 border-b border-border/50 px-5 pt-5">
              <CardTitle className="text-[15px]">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-5 grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-20 flex flex-col gap-2 items-center justify-center bg-background/50 hover:bg-card border-border/50" onClick={() => navigate('/tasks/new')}>
                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center"><Plus size={16} className="text-purple-400" /></div>
                <span className="text-xs font-medium">Add Task</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2 items-center justify-center bg-background/50 hover:bg-card border-border/50" onClick={() => navigate('/ai-chat')}>
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center"><Sparkles size={16} className="text-blue-400" /></div>
                <span className="text-xs font-medium">Ask AI</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2 items-center justify-center bg-background/50 hover:bg-card border-border/50" onClick={() => navigate('/tasks/new')}>
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center"><Mic size={16} className="text-green-400" /></div>
                <span className="text-xs font-medium">Voice Task</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2 items-center justify-center bg-background/50 hover:bg-card border-border/50" onClick={() => navigate('/calendar')}>
                <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center"><Clock size={16} className="text-orange-400" /></div>
                <span className="text-xs font-medium">Calendar</span>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border/50 animate-fade-up delay-200">
            <CardHeader className="pb-3 border-b border-border/50 px-5 pt-5">
              <CardTitle className="text-[15px] flex items-center gap-2">
                <Sparkles size={16} className="text-purple-400" /> AI Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex flex-col divide-y divide-border/50">
                {aiSuggestions.map((suggestion, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 hover:bg-white/5 transition-colors">
                    <div className="mt-0.5 shrink-0 bg-background rounded-full p-1.5 shadow-sm border border-border/50">{suggestion.icon}</div>
                    <span className="text-sm text-foreground/90 leading-snug">{suggestion.text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border/50 animate-fade-up delay-300">
            <CardHeader className="pb-3 border-b border-border/50 px-5 pt-5">
              <CardTitle className="text-[15px] flex items-center gap-2">
                <Clock size={16} className="text-orange-400" /> Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {tasks.length === 0 ? (
                <div className="p-5 text-center text-sm text-muted-foreground">No upcoming deadlines</div>
              ) : (
                <div className="flex flex-col divide-y divide-border/50">
                  {tasks.slice(0, 3).map((task) => (
                    <div key={task.id} className="flex items-center gap-3 p-4 hover:bg-white/5 transition-colors cursor-pointer group">
                      <div className={cn("w-2 h-2 rounded-full shrink-0", (priorityConfig[task.priority] || priorityConfig.medium).bg.replace('/10', ''))} />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-sm font-semibold truncate group-hover:text-purple-400 transition-colors">{task.title}</span>
                        <span className="text-xs text-muted-foreground mt-0.5">{formatDeadline(task.deadline)}</span>
                      </div>
                      <ArrowUpRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
