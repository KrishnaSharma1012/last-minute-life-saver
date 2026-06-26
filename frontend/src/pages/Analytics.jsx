import { BarChart3, TrendingUp, CheckCircle2, Clock, Sparkles, Zap, Trophy } from 'lucide-react'
import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../context/AuthContext'
import './Analytics.css'

export default function Analytics() {
  const { user, userProfile } = useAuth()
  const [allTasks, setAllTasks] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch all tasks (completed + active) from Firestore
  useEffect(() => {
    if (!user) return

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
  const activeTasks = allTasks.filter(t => t.status !== 'completed')
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
      <div className="analytics-page">
        <div className="task-loading">
          <div className="loading-spinner" />
          <p>Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="analytics-page">
      <div className="analytics-header animate-fade-up">
        <BarChart3 size={20} style={{ color: 'var(--purple)' }} />
        <h2>Analytics</h2>
        <span className="badge badge-purple"><Sparkles size={10} /> AI-Powered Insights</span>
      </div>

      {/* Overview Cards */}
      <div className="analytics-overview animate-fade-up delay-1">
        <div className="overview-card">
          <div className="ov-icon" style={{ background: 'var(--green-soft)' }}>
            <CheckCircle2 size={20} style={{ color: 'var(--green)' }} />
          </div>
          <div className="ov-value">{completedTasks.length}</div>
          <div className="ov-label">Tasks Completed</div>
          <div className="ov-change positive">of {allTasks.length} total</div>
        </div>
        <div className="overview-card">
          <div className="ov-icon" style={{ background: 'var(--purple-soft)' }}>
            <TrendingUp size={20} style={{ color: 'var(--purple)' }} />
          </div>
          <div className="ov-value">{completionRate}%</div>
          <div className="ov-label">Completion Rate</div>
          <div className={`ov-change ${completionRate >= 50 ? 'positive' : ''}`}>
            {completionRate >= 70 ? '🔥 Crushing it!' : 'Keep going!'}
          </div>
        </div>
        <div className="overview-card">
          <div className="ov-icon" style={{ background: 'var(--orange-soft)' }}>
            <Clock size={20} style={{ color: 'var(--orange)' }} />
          </div>
          <div className="ov-value">{avgFocusTime}h</div>
          <div className="ov-label">Avg Task Time</div>
          <div className="ov-change">{totalFocusHours.toFixed(0)}h total</div>
        </div>
        <div className="overview-card">
          <div className="ov-icon" style={{ background: 'var(--blue-soft)' }}>
            <Trophy size={20} style={{ color: 'var(--blue)' }} />
          </div>
          <div className="ov-value">Lv.{userProfile?.level || 1}</div>
          <div className="ov-label">{userProfile?.xp || 0} XP</div>
          <div className="ov-change">{userProfile?.streakDays || 0} day streak</div>
        </div>
      </div>

      {/* Chart + Insights Grid */}
      <div className="analytics-grid">
        {/* Weekly Chart */}
        <div className="chart-card animate-fade-up delay-2">
          <h3 className="section-title-sm">Weekly Task Distribution</h3>
          <div className="bar-chart">
            {weeklyData.map((d, i) => (
              <div key={i} className="bar-group">
                <div className="bar-container">
                  <div
                    className="bar bar-total"
                    style={{ height: `${(d.total / maxVal) * 100}%` }}
                  ></div>
                  <div
                    className="bar bar-completed"
                    style={{ height: `${(d.completed / maxVal) * 100}%` }}
                  ></div>
                </div>
                <span className="bar-label">{d.day}</span>
                <span className="bar-value">{d.completed}/{d.total}</span>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <span><span className="legend-dot" style={{ background: 'var(--purple)' }}></span> Completed</span>
            <span><span className="legend-dot" style={{ background: 'rgba(255,255,255,0.08)' }}></span> Total</span>
          </div>
        </div>

        {/* AI Insights */}
        <div className="insights-card animate-fade-up delay-3">
          <h3 className="section-title-sm">
            <Sparkles size={14} style={{ color: 'var(--purple)' }} /> AI Insights
          </h3>
          <div className="insights-list">
            {insights.map((insight, i) => (
              <div key={i} className="insight-item">
                <span className="insight-icon">{insight.icon}</span>
                <div className="insight-info">
                  <span className="insight-title">{insight.title}</span>
                  <span className="insight-value">{insight.value}</span>
                  <span className="insight-desc">{insight.desc}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Category Breakdown */}
          {categoryData.length > 0 && (
            <div className="category-breakdown">
              <h4 className="section-title-sm" style={{ marginTop: '16px' }}>Category Breakdown</h4>
              {categoryData.map((cat, i) => (
                <div key={i} className="category-row">
                  <span className="cat-name">{cat.name}</span>
                  <div className="cat-bar-wrap">
                    <div className="cat-bar-fill" style={{ width: `${cat.rate}%` }}></div>
                  </div>
                  <span className="cat-rate">{cat.rate}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
