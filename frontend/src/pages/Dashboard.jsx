import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Zap, Clock, CheckCircle2, Flame, TrendingUp, Plus,
  Sparkles, ChevronRight, ArrowUpRight, Timer,
  AlertTriangle, Star, Mic, Trophy,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  collection, query, where, orderBy, onSnapshot,
  doc, updateDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import toast from 'react-hot-toast'
import './Dashboard.css'

const priorityConfig = {
  critical: { color: 'var(--red)', bg: 'var(--red-soft)', label: 'CRITICAL', icon: '🔴' },
  high: { color: 'var(--pink)', bg: 'var(--pink-soft)', label: 'HIGH', icon: '🟠' },
  medium: { color: 'var(--orange)', bg: 'var(--orange-soft)', label: 'MEDIUM', icon: '🟡' },
  low: { color: 'var(--green)', bg: 'var(--green-soft)', label: 'LOW', icon: '🟢' },
}

// XP rewards by priority
const XP_REWARDS = { critical: 50, high: 30, medium: 20, low: 10 }

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, userProfile, updateProfile } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [aiSuggestions, setAiSuggestions] = useState([])

  // Fetch tasks from Firestore in real-time
  useEffect(() => {
    if (!user) return

    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', user.uid),
      where('status', 'in', ['pending', 'in-progress']),
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      // Sort by priorityScore descending
      taskList.sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))
      setTasks(taskList)
      setLoading(false)
    }, (error) => {
      console.error('Error fetching tasks:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  // Fetch AI suggestions
  useEffect(() => {
    if (tasks.length === 0) {
      setAiSuggestions([
        { icon: <Plus size={14} style={{ color: 'var(--purple)' }} />, text: 'Add your first task to get AI-powered suggestions!' },
      ])
      return
    }

    const urgentTasks = tasks.filter(t => t.priority === 'critical' || t.priority === 'high')
    const suggestions = []

    if (urgentTasks.length > 0) {
      suggestions.push({
        icon: <AlertTriangle size={14} style={{ color: 'var(--orange)' }} />,
        text: `Focus on "${urgentTasks[0].title}" first — it's your highest priority right now`,
      })
    }

    const totalHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 1), 0)
    suggestions.push({
      icon: <TrendingUp size={14} style={{ color: 'var(--green)' }} />,
      text: `You have ~${totalHours.toFixed(1)} hours of work queued. ${totalHours > 6 ? 'Consider delegating or rescheduling some tasks.' : 'Manageable! You got this.'}`,
    })

    suggestions.push({
      icon: <Flame size={14} style={{ color: 'var(--pink)' }} />,
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
      const taskRef = doc(db, 'tasks', taskId)
      const updates = {
        completedSteps: newCompleted,
        updatedAt: serverTimestamp(),
      }

      if (isFullyDone) {
        updates.status = 'completed'
        updates.completedAt = serverTimestamp()

        // Award XP
        const xpGain = XP_REWARDS[task.priority] || 10
        const newXp = (userProfile?.xp || 0) + xpGain
        const newLevel = Math.floor(newXp / 100) + 1
        const newTasksCompleted = (userProfile?.tasksCompleted || 0) + 1

        await updateProfile({
          xp: newXp,
          level: newLevel,
          tasksCompleted: newTasksCompleted,
        })

        toast.success(`🎉 Task completed! +${xpGain} XP`)
      } else {
        toast.success('Step completed! Keep going 💪')
      }

      await updateDoc(taskRef, updates)
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('Failed to update task')
    }
  }, [userProfile, updateProfile])

  // Complete entire task
  const handleCompleteTask = useCallback(async (taskId, task) => {
    try {
      const taskRef = doc(db, 'tasks', taskId)
      await updateDoc(taskRef, {
        status: 'completed',
        completedSteps: task.actionSteps?.length || 0,
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

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
  const xpForNextLevel = currentLevel * 100
  const xpProgress = ((currentXp % 100) / 100) * 100

  // Format deadline for display
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
    <div className="dashboard">
      {/* AI Insight Banner */}
      <div className="ai-insight-banner animate-fade-up">
        <div className="ai-banner-glow"></div>
        <div className="ai-banner-content">
          <div className="ai-banner-left">
            <div className="ai-banner-icon">
              <Sparkles size={22} />
            </div>
            <div>
              <h3 className="ai-banner-title">{getGreeting()}! 👋</h3>
              <p className="ai-banner-text">
                {tasks.length > 0 ? (
                  <>
                    You have <strong>{urgentTasks.length} urgent task{urgentTasks.length !== 1 ? 's' : ''}</strong> today.
                    {tasks[0] && (
                      <> Start with "<strong>{tasks[0].title}</strong>" — it needs ~{tasks[0].estimatedHours || 1}hrs of focus.</>
                    )}
                  </>
                ) : (
                  <>You're all clear! 🎉 Add a new task to get started with AI-powered prioritization.</>
                )}
              </p>
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/ai-chat')}>
            <Sparkles size={14} />
            Ask AI for help
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-row">
        <div className="stat-card animate-fade-up delay-1">
          <div className="stat-icon-wrap" style={{ background: 'var(--green-soft)' }}>
            <CheckCircle2 size={20} style={{ color: 'var(--green)' }} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{completedToday}</span>
            <span className="stat-label">Tasks done</span>
          </div>
        </div>
        <div className="stat-card animate-fade-up delay-2">
          <div className="stat-icon-wrap" style={{ background: 'var(--orange-soft)' }}>
            <Flame size={20} style={{ color: 'var(--orange)' }} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{streakDays}</span>
            <span className="stat-label">Day streak 🔥</span>
          </div>
        </div>
        <div className="stat-card animate-fade-up delay-3">
          <div className="stat-icon-wrap" style={{ background: 'var(--purple-soft)' }}>
            <Trophy size={20} style={{ color: 'var(--purple)' }} />
          </div>
          <div className="stat-info">
            <span className="stat-value">Lv.{currentLevel}</span>
            <span className="stat-label">{currentXp} XP</span>
          </div>
        </div>
        <div className="stat-card animate-fade-up delay-4">
          <div className="stat-icon-wrap" style={{ background: 'var(--blue-soft)' }}>
            <Timer size={20} style={{ color: 'var(--blue)' }} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{tasks.length}</span>
            <span className="stat-label">Active tasks</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Priority Tasks */}
        <div className="dashboard-tasks">
          <div className="section-header">
            <h3>
              <Zap size={18} style={{ color: 'var(--purple)' }} />
              AI-Prioritized Tasks
            </h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/tasks/new')}>
              <Plus size={14} /> Add Task
            </button>
          </div>

          <div className="task-list">
            {loading ? (
              <div className="task-loading">
                <div className="loading-spinner" />
                <p>Loading your tasks...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="task-empty">
                <Sparkles size={32} style={{ color: 'var(--purple)', opacity: 0.5 }} />
                <h4>No tasks yet</h4>
                <p>Add your first task and let AI prioritize it!</p>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/tasks/new')}>
                  <Plus size={14} /> Add Task
                </button>
              </div>
            ) : (
              tasks.map((task, index) => {
                const config = priorityConfig[task.priority] || priorityConfig.medium
                const progress = task.actionSteps?.length > 0
                  ? ((task.completedSteps || 0) / task.actionSteps.length) * 100
                  : 0

                return (
                  <div
                    key={task.id}
                    className={`task-card animate-fade-up delay-${Math.min(index + 1, 5)}`}
                    style={{ '--accent': config.color }}
                  >
                    <div className="task-card-top">
                      <div className="task-priority-badge" style={{ background: config.bg, color: config.color }}>
                        {config.icon} {config.label}
                      </div>
                      <span className="task-category">{task.category || 'General'}</span>
                    </div>

                    <h4 className="task-title">{task.title}</h4>

                    <div className="task-meta">
                      <span className="task-deadline">
                        <Clock size={12} />
                        Due in {formatDeadline(task.deadline)}
                      </span>
                      <span className="task-estimate">
                        <Timer size={12} />
                        ~{task.estimatedHours || 1}h
                      </span>
                      <span className="task-score">
                        <Star size={12} />
                        Score: {task.priorityScore || 50}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="task-progress-area">
                      <div className="task-progress-bar">
                        <div
                          className="task-progress-fill"
                          style={{ width: `${progress}%`, background: config.color }}
                        ></div>
                      </div>
                      <span className="task-progress-text">
                        {task.completedSteps || 0}/{task.actionSteps?.length || 0} steps
                      </span>
                    </div>

                    {/* Action Steps Preview */}
                    {task.actionSteps?.length > 0 && (
                      <div className="task-steps-preview">
                        {task.actionSteps.slice(0, 2).map((step, i) => (
                          <div key={i} className={`step-item ${i < (task.completedSteps || 0) ? 'step-done' : ''}`}>
                            <div className="step-check">
                              {i < (task.completedSteps || 0) ? <CheckCircle2 size={12} /> : <div className="step-circle"></div>}
                            </div>
                            <span>{step}</span>
                          </div>
                        ))}
                        {task.actionSteps.length > 2 && (
                          <span className="steps-more">+{task.actionSteps.length - 2} more steps</span>
                        )}
                      </div>
                    )}

                    <div className="task-card-actions">
                      <button
                        className="task-action-btn"
                        onClick={() => handleCompleteStep(task.id, task)}
                      >
                        {(task.completedSteps || 0) < (task.actionSteps?.length || 1) - 1
                          ? 'Next Step'
                          : 'Complete'
                        } <ChevronRight size={14} />
                      </button>
                      <button
                        className="task-done-btn"
                        onClick={() => handleCompleteTask(task.id, task)}
                        title="Mark as done"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="dashboard-right">
          {/* XP Progress */}
          <div className="xp-card animate-fade-up delay-1">
            <h3 className="section-title-sm">
              <Trophy size={14} style={{ color: 'var(--purple)' }} />
              Level Progress
            </h3>
            <div className="xp-progress-info">
              <span className="xp-level-text">Level {currentLevel}</span>
              <span className="xp-amount">{currentXp % 100}/{100} XP</span>
            </div>
            <div className="xp-progress-bar">
              <div className="xp-progress-fill" style={{ width: `${xpProgress}%` }}></div>
            </div>
            <p className="xp-hint">Complete tasks to earn XP and level up! 🚀</p>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions-card animate-fade-up delay-2">
            <h3 className="section-title-sm">Quick Actions</h3>
            <div className="quick-actions-grid">
              <button className="quick-action" onClick={() => navigate('/tasks/new')}>
                <div className="qa-icon" style={{ background: 'var(--purple-soft)' }}>
                  <Plus size={18} style={{ color: 'var(--purple)' }} />
                </div>
                <span>Add Task</span>
              </button>
              <button className="quick-action" onClick={() => navigate('/ai-chat')}>
                <div className="qa-icon" style={{ background: 'var(--blue-soft)' }}>
                  <Sparkles size={18} style={{ color: 'var(--blue)' }} />
                </div>
                <span>Ask AI</span>
              </button>
              <button className="quick-action" onClick={() => navigate('/tasks/new')}>
                <div className="qa-icon" style={{ background: 'var(--green-soft)' }}>
                  <Mic size={18} style={{ color: 'var(--green)' }} />
                </div>
                <span>Voice Task</span>
              </button>
              <button className="quick-action" onClick={() => navigate('/calendar')}>
                <div className="qa-icon" style={{ background: 'var(--orange-soft)' }}>
                  <Clock size={18} style={{ color: 'var(--orange)' }} />
                </div>
                <span>Calendar</span>
              </button>
            </div>
          </div>

          {/* AI Suggestions */}
          <div className="ai-suggestions-card animate-fade-up delay-3">
            <h3 className="section-title-sm">
              <Sparkles size={14} style={{ color: 'var(--purple)' }} />
              AI Suggestions
            </h3>
            <div className="suggestion-list">
              {aiSuggestions.map((suggestion, i) => (
                <div key={i} className="suggestion-item">
                  {suggestion.icon}
                  <span>{suggestion.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="deadlines-card animate-fade-up delay-4">
            <h3 className="section-title-sm">
              <Clock size={14} style={{ color: 'var(--orange)' }} />
              Upcoming Deadlines
            </h3>
            <div className="deadline-list">
              {tasks.length === 0 ? (
                <p className="deadline-empty">No upcoming deadlines</p>
              ) : (
                tasks.slice(0, 3).map((task) => (
                  <div key={task.id} className="deadline-item">
                    <div
                      className="deadline-dot"
                      style={{ background: (priorityConfig[task.priority] || priorityConfig.medium).color }}
                    ></div>
                    <div className="deadline-info">
                      <span className="deadline-title">{task.title}</span>
                      <span className="deadline-time">{formatDeadline(task.deadline)}</span>
                    </div>
                    <ArrowUpRight size={14} className="deadline-arrow" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
