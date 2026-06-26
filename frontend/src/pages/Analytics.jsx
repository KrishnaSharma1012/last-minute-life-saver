import { BarChart3, TrendingUp, CheckCircle2, Clock, Sparkles, Trophy } from 'lucide-react'
import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db, isDemoMode } from '../config/firebase'
import { getDemoTasks } from '../data/demoStore'
import { useAuth } from '../context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0 border border-purple-500/30">
            <BarChart3 size={20} className="text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold font-heading">Analytics</h2>
        </div>
        <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30 font-bold tracking-wider py-1">
          <Sparkles size={12} className="mr-1.5" /> AI-Powered Insights
        </Badge>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur-xl border-border/50 animate-fade-up delay-75">
          <CardContent className="p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 size={20} className="text-green-500" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-bold font-heading">{completedTasks.length}</span>
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Tasks Completed</span>
            </div>
            <div className="text-xs font-semibold text-green-400">
              of {allTasks.length} total tasks
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur-xl border-border/50 animate-fade-up delay-100">
          <CardContent className="p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <TrendingUp size={20} className="text-purple-500" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-bold font-heading">{completionRate}%</span>
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Completion Rate</span>
            </div>
            <div className={cn("text-xs font-semibold", completionRate >= 70 ? "text-green-400" : "text-orange-400")}>
              {completionRate >= 70 ? '🔥 Crushing it!' : 'Keep going!'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-xl border-border/50 animate-fade-up delay-150">
          <CardContent className="p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Clock size={20} className="text-orange-500" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-bold font-heading">{avgFocusTime}h</span>
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Avg Task Time</span>
            </div>
            <div className="text-xs font-semibold text-muted-foreground">
              {totalFocusHours.toFixed(0)}h total
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-xl border-border/50 animate-fade-up delay-200">
          <CardContent className="p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Trophy size={20} className="text-blue-500" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-bold font-heading">Lv.{userProfile?.level || 1}</span>
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{userProfile?.xp || 0} XP</span>
            </div>
            <div className="text-xs font-semibold text-blue-400">
              {userProfile?.streakDays || 0} day streak
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart + Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Chart */}
        <Card className="lg:col-span-2 bg-card/50 backdrop-blur-xl border-border/50 animate-fade-up delay-300">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-lg">Weekly Task Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-64 flex items-end justify-between gap-2">
              {weeklyData.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
                  <div className="w-full max-w-[40px] h-48 bg-muted/30 rounded-t-lg relative overflow-hidden transition-colors group-hover:bg-muted/50">
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-white/10 transition-all duration-500"
                      style={{ height: `${(d.total / maxVal) * 100}%` }}
                    />
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-purple-600 to-purple-400 transition-all duration-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                      style={{ height: `${(d.completed / maxVal) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{d.day}</span>
                  <span className="text-xs font-semibold text-foreground bg-background/50 px-2 py-0.5 rounded border border-border/50">
                    {d.completed}/{d.total}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-border/50">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <div className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]" /> Completed
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <div className="w-3 h-3 rounded-full bg-muted-foreground/30" /> Total
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Insights & Category Breakdown */}
        <div className="flex flex-col gap-6">
          <Card className="bg-card/50 backdrop-blur-xl border-border/50 animate-fade-up delay-400">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles size={18} className="text-purple-400" /> AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex flex-col divide-y divide-border/50">
                {insights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-4 p-5 hover:bg-muted/30 transition-colors">
                    <div className="text-2xl mt-1 shrink-0">{insight.icon}</div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{insight.title}</span>
                        <span className="text-sm font-bold text-foreground bg-background/50 px-2 py-0.5 rounded border border-border/50">
                          {insight.value}
                        </span>
                      </div>
                      <span className="text-sm text-foreground/80 leading-snug">{insight.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {categoryData.length > 0 && (
            <Card className="bg-card/50 backdrop-blur-xl border-border/50 animate-fade-up delay-500">
              <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="text-lg">Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="p-5 flex flex-col gap-4">
                {categoryData.map((cat, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="w-24 font-semibold text-muted-foreground uppercase tracking-wider truncate">{cat.name}</span>
                    <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" 
                        style={{ width: `${cat.rate}%` }} 
                      />
                    </div>
                    <span className="w-12 text-right font-bold">{cat.rate}%</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
