import { BarChart3, TrendingUp, CheckCircle2, Clock, Sparkles, Trophy } from 'lucide-react'
import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db, isDemoMode } from '../config/firebase'
import { getDemoTasks } from '../data/demoStore'
import { useAuth } from '../context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

export default function Analytics() {
  const { user, userProfile } = useAuth()
  const [allTasks, setAllTasks] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch all tasks (completed + active) from Firestore
  useEffect(() => {
    if (!user) return

    if (isDemoMode) {
      setAllTasks(getDemoTasks())
      setLoading(false)
      return
    }

    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', user.uid),
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      setAllTasks(taskList)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  // Compute stats
  const completedTasks = allTasks.filter(t => t.status === 'completed')
  const completionRate = allTasks.length > 0
    ? Math.round((completedTasks.length / allTasks.length) * 100)
    : 0

  const totalFocusHours = allTasks.reduce((sum, t) => sum + (t.estimatedHours || 1), 0)
  const avgFocusTime = allTasks.length > 0 ? (totalFocusHours / allTasks.length).toFixed(1) : '0'

  // Weekly data — compute from actual tasks
  const getWeeklyData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const data = days.map(day => ({ day, completed: 0, total: 0 }))

    allTasks.forEach(task => {
      try {
        const created = task.createdAt?.toDate ? task.createdAt.toDate() : new Date(task.createdAt)
        const dayIndex = (created.getDay() + 6) % 7 // Monday = 0
        if (dayIndex >= 0 && dayIndex < 7) {
          data[dayIndex].total += 1
          if (task.status === 'completed') {
            data[dayIndex].completed += 1
          }
        }
      } catch {
        // skip malformed dates
      }
    })

    // If no real data, show demo data
    if (allTasks.length === 0) {
      return [
        { day: 'Mon', completed: 6, total: 8 },
        { day: 'Tue', completed: 5, total: 7 },
        { day: 'Wed', completed: 8, total: 9 },
        { day: 'Thu', completed: 4, total: 6 },
        { day: 'Fri', completed: 7, total: 8 },
        { day: 'Sat', completed: 3, total: 4 },
        { day: 'Sun', completed: 2, total: 3 },
      ]
    }

    return data
  }

  const weeklyData = getWeeklyData()
  const maxVal = Math.max(...weeklyData.map(d => d.total), 1)

  // Category breakdown
  const getCategoryData = () => {
    const categories = {}
    allTasks.forEach(t => {
      const cat = t.category || 'General'
      if (!categories[cat]) categories[cat] = { total: 0, completed: 0 }
      categories[cat].total += 1
      if (t.status === 'completed') categories[cat].completed += 1
    })
    return Object.entries(categories).map(([name, data]) => ({
      name,
      ...data,
      rate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
    }))
  }

  const categoryData = getCategoryData()

  // AI Insights (computed from real data)
  const getInsights = () => {
    if (allTasks.length === 0) {
      return [
        { icon: '🎯', title: 'Get Started', value: 'Add tasks!', desc: 'Create your first task to see insights' },
      ]
    }

    const insights = []

    // Best day
    const bestDay = weeklyData.reduce((best, d) =>
      d.completed > best.completed ? d : best, weeklyData[0])
    if (bestDay.completed > 0) {
      insights.push({
        icon: '🎯',
        title: 'Best Day',
        value: bestDay.day,
        desc: `You complete the most tasks on ${bestDay.day}s`,
      })
    }

    // Completion rate
    insights.push({
      icon: '📈',
      title: 'Completion',
      value: `${completionRate}%`,
      desc: completionRate > 70 ? 'Excellent completion rate!' : 'Keep pushing to improve',
    })

    // Level progress
    insights.push({
      icon: '🏆',
      title: 'Level',
      value: `Lv.${userProfile?.level || 1}`,
      desc: `${userProfile?.xp || 0} XP earned total`,
    })

    // Tasks stat
    insights.push({
      icon: '✅',
      title: 'Completed',
      value: `${completedTasks.length}`,
      desc: `Out of ${allTasks.length} total tasks`,
    })

    return insights
  }

  const insights = getInsights()

  const statCards = [
    { icon: CheckCircle2, color: 'green', value: completedTasks.length, label: 'Tasks Completed', sub: `of ${allTasks.length} total tasks` },
    { icon: TrendingUp, color: 'purple', value: `${completionRate}%`, label: 'Completion Rate', sub: completionRate >= 70 ? '🔥 Crushing it!' : 'Keep going!' },
    { icon: Clock, color: 'orange', value: `${avgFocusTime}h`, label: 'Avg Task Time', sub: `${totalFocusHours.toFixed(0)}h total` },
    { icon: Trophy, color: 'blue', value: `Lv.${userProfile?.level || 1}`, label: `${userProfile?.xp || 0} XP`, sub: `${userProfile?.streakDays || 0} day streak` },
  ]

  const colorClasses = {
    green: { bg: 'bg-green-500/10', text: 'text-green-500' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-500' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-500' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    )
  }

  return (
    <motion.div
      className="flex flex-col gap-6 max-w-7xl mx-auto w-full"
      variants={stagger}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center shrink-0 border border-purple-500/20 glow-purple">
            <BarChart3 size={20} className="text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold font-heading">Analytics</h2>
        </div>
        <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20 font-bold tracking-wider py-1">
          <Sparkles size={12} className="mr-1.5" /> AI-Powered Insights
        </Badge>
      </motion.div>

      {/* Overview Cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => {
          const c = colorClasses[stat.color]
          return (
            <motion.div
              key={i}
              variants={fadeUp}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
            >
              <Card className="glass-card card-hover border-white/[0.05]">
                <CardContent className="p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", c.bg)}>
                      <stat.icon size={20} className={c.text} />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-3xl font-bold font-heading">{stat.value}</span>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">{stat.label}</span>
                  </div>
                  <div className={cn("text-xs font-semibold", stat.color === 'green' ? 'text-green-400' : stat.color === 'purple' ? (completionRate >= 70 ? 'text-green-400' : 'text-orange-400') : stat.color === 'blue' ? 'text-blue-400' : 'text-muted-foreground')}>
                    {stat.sub}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Chart + Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Chart */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <Card className="glass-card border-white/[0.05] shadow-xl overflow-hidden relative">
            <div className="absolute -top-20 -right-20 w-40 h-40 orb-purple opacity-15 pointer-events-none" />
            <CardHeader className="border-b border-white/[0.04] pb-4 relative z-10">
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <BarChart3 size={16} className="text-purple-400" /> Weekly Task Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 relative z-10">
              <div className="h-64 flex items-end justify-between gap-3">
                {weeklyData.map((d, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
                    <div className="w-full max-w-[44px] h-48 bg-white/[0.03] rounded-lg relative overflow-hidden transition-colors group-hover:bg-white/[0.05] border border-white/[0.04]">
                      {/* Total bar (background) */}
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 bg-white/[0.06]"
                        initial={{ height: 0 }}
                        animate={{ height: `${(d.total / maxVal) * 100}%` }}
                        transition={{ duration: 0.7, delay: 0.3 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                      />
                      {/* Completed bar (foreground) */}
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-sm shadow-[0_0_15px_rgba(124,111,255,0.3)]"
                        initial={{ height: 0 }}
                        animate={{ height: `${(d.completed / maxVal) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.4 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.12em]">{d.day}</span>
                    <span className="text-[10px] font-semibold text-foreground glass-light px-1.5 py-0.5 rounded">
                      {d.completed}/{d.total}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-white/[0.04]">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">
                  <div className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(124,111,255,0.5)]" /> Completed
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">
                  <div className="w-3 h-3 rounded-full bg-white/[0.08]" /> Total
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Insights & Category Breakdown */}
        <motion.div variants={stagger} className="flex flex-col gap-6">
          <motion.div variants={fadeUp}>
            <Card className="glass-card border-white/[0.05]">
              <CardHeader className="border-b border-white/[0.04] pb-3 px-5 pt-5">
                <CardTitle className="text-[14px] flex items-center gap-2 font-heading">
                  <Sparkles size={15} className="text-purple-400" /> AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex flex-col divide-y divide-white/[0.04]">
                  {insights.map((insight, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.08 }}
                      className="flex items-start gap-3 p-4 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="text-xl mt-0.5 shrink-0 glass-light rounded-full w-9 h-9 flex items-center justify-center">{insight.icon}</div>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/50">{insight.title}</span>
                          <span className="text-[12px] font-bold text-foreground glass-light px-2 py-0.5 rounded">{insight.value}</span>
                        </div>
                        <span className="text-[12px] text-muted-foreground/70 leading-snug">{insight.desc}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {categoryData.length > 0 && (
            <motion.div variants={fadeUp}>
              <Card className="glass-card border-white/[0.05]">
                <CardHeader className="border-b border-white/[0.04] pb-3 px-5 pt-5">
                  <CardTitle className="text-[14px] font-heading">Category Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="p-5 flex flex-col gap-4">
                  {categoryData.map((cat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.1 }}
                      className="flex items-center gap-3 text-sm"
                    >
                      <span className="w-20 font-semibold text-[11px] text-muted-foreground/60 uppercase tracking-[0.1em] truncate">{cat.name}</span>
                      <div className="flex-1 h-2 bg-white/[0.04] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-[0_0_8px_rgba(124,111,255,0.3)]"
                          initial={{ width: 0 }}
                          animate={{ width: `${cat.rate}%` }}
                          transition={{ duration: 0.8, delay: 0.7 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </div>
                      <span className="w-10 text-right font-bold text-[12px]">{cat.rate}%</span>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}
