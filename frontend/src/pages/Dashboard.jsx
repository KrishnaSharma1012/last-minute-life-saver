import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Zap,
  Clock,
  CheckCircle2,
  Flame,
  TrendingUp,
  Plus,
  Sparkles,
  ChevronRight,
  ArrowUpRight,
  Timer,
  AlertTriangle,
  Star,
  Mic,
} from 'lucide-react'
import './Dashboard.css'

// Demo data — will be replaced with API calls
const DEMO_TASKS = [
  {
    id: '1',
    title: 'Complete Project Report',
    deadline: '4 hours',
    priority: 'critical',
    priorityScore: 95,
    estimatedHours: 2,
    status: 'in-progress',
    actionSteps: ['Gather data from team', 'Write executive summary', 'Add charts', 'Review and submit'],
    completedSteps: 1,
    category: 'Work',
  },
  {
    id: '2',
    title: 'Prepare Presentation Slides',
    deadline: '6 hours',
    priority: 'high',
    priorityScore: 82,
    estimatedHours: 1.5,
    status: 'pending',
    actionSteps: ['Create outline', 'Design slides', 'Add content', 'Practice run'],
    completedSteps: 0,
    category: 'Work',
  },
  {
    id: '3',
    title: 'Reply to Client Emails',
    deadline: '2 hours',
    priority: 'high',
    priorityScore: 78,
    estimatedHours: 0.5,
    status: 'pending',
    actionSteps: ['Read all pending emails', 'Draft responses', 'Send follow-ups'],
    completedSteps: 0,
    category: 'Communication',
  },
  {
    id: '4',
    title: 'Grocery Shopping',
    deadline: 'Tomorrow',
    priority: 'medium',
    priorityScore: 45,
    estimatedHours: 1,
    status: 'pending',
    actionSteps: ['Make list', 'Go to store', 'Put away groceries'],
    completedSteps: 0,
    category: 'Personal',
  },
  {
    id: '5',
    title: 'Read Chapter 5 - AI Fundamentals',
    deadline: '3 days',
    priority: 'low',
    priorityScore: 30,
    estimatedHours: 1.5,
    status: 'pending',
    actionSteps: ['Read chapter', 'Take notes', 'Review key concepts'],
    completedSteps: 0,
    category: 'Learning',
  },
]

const priorityConfig = {
  critical: { color: 'var(--red)', bg: 'var(--red-soft)', label: 'CRITICAL', icon: '🔴' },
  high: { color: 'var(--pink)', bg: 'var(--pink-soft)', label: 'HIGH', icon: '🟠' },
  medium: { color: 'var(--orange)', bg: 'var(--orange-soft)', label: 'MEDIUM', icon: '🟡' },
  low: { color: 'var(--green)', bg: 'var(--green-soft)', label: 'LOW', icon: '🟢' },
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [tasks] = useState(DEMO_TASKS)

  const completedToday = 5
  const streakDays = 12
  const successRate = 87

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const urgentTasks = tasks.filter(t => t.priority === 'critical' || t.priority === 'high')

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
              <h3 className="ai-banner-title">{getGreeting()}, Krishna! 👋</h3>
              <p className="ai-banner-text">
                You have <strong>{urgentTasks.length} urgent tasks</strong> today. Start with
                "<strong>{tasks[0]?.title}</strong>" — it's due in {tasks[0]?.deadline} and needs
                ~{tasks[0]?.estimatedHours}hrs of focus. I've sorted everything by priority.
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
            <span className="stat-label">Done today</span>
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
            <TrendingUp size={20} style={{ color: 'var(--purple)' }} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{successRate}%</span>
            <span className="stat-label">Success rate</span>
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
            {tasks.map((task, index) => {
              const config = priorityConfig[task.priority]
              const progress = task.actionSteps.length > 0
                ? (task.completedSteps / task.actionSteps.length) * 100
                : 0

              return (
                <div
                  key={task.id}
                  className={`task-card animate-fade-up delay-${index + 1}`}
                  style={{ '--accent': config.color }}
                >
                  <div className="task-card-top">
                    <div className="task-priority-badge" style={{ background: config.bg, color: config.color }}>
                      {config.icon} {config.label}
                    </div>
                    <span className="task-category">{task.category}</span>
                  </div>

                  <h4 className="task-title">{task.title}</h4>

                  <div className="task-meta">
                    <span className="task-deadline">
                      <Clock size={12} />
                      Due in {task.deadline}
                    </span>
                    <span className="task-estimate">
                      <Timer size={12} />
                      ~{task.estimatedHours}h
                    </span>
                    <span className="task-score">
                      <Star size={12} />
                      Score: {task.priorityScore}
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
                      {task.completedSteps}/{task.actionSteps.length} steps
                    </span>
                  </div>

                  {/* Action Steps Preview */}
                  <div className="task-steps-preview">
                    {task.actionSteps.slice(0, 2).map((step, i) => (
                      <div key={i} className={`step-item ${i < task.completedSteps ? 'step-done' : ''}`}>
                        <div className="step-check">
                          {i < task.completedSteps ? <CheckCircle2 size={12} /> : <div className="step-circle"></div>}
                        </div>
                        <span>{step}</span>
                      </div>
                    ))}
                    {task.actionSteps.length > 2 && (
                      <span className="steps-more">+{task.actionSteps.length - 2} more steps</span>
                    )}
                  </div>

                  <button className="task-action-btn">
                    {task.status === 'in-progress' ? 'Continue' : 'Start'} <ChevronRight size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Panel */}
        <div className="dashboard-right">
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
              <div className="suggestion-item">
                <AlertTriangle size={14} style={{ color: 'var(--orange)' }} />
                <span>Block 2 hours for the Project Report now — your calendar is free until 2 PM</span>
              </div>
              <div className="suggestion-item">
                <TrendingUp size={14} style={{ color: 'var(--green)' }} />
                <span>Your productivity peaks at 10 AM. Schedule hard tasks then!</span>
              </div>
              <div className="suggestion-item">
                <Flame size={14} style={{ color: 'var(--pink)' }} />
                <span>You're on a 12-day streak! Complete 2 more tasks to reach a personal best</span>
              </div>
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="deadlines-card animate-fade-up delay-4">
            <h3 className="section-title-sm">
              <Clock size={14} style={{ color: 'var(--orange)' }} />
              Upcoming Deadlines
            </h3>
            <div className="deadline-list">
              {tasks.slice(0, 3).map((task) => (
                <div key={task.id} className="deadline-item">
                  <div
                    className="deadline-dot"
                    style={{ background: priorityConfig[task.priority].color }}
                  ></div>
                  <div className="deadline-info">
                    <span className="deadline-title">{task.title}</span>
                    <span className="deadline-time">{task.deadline}</span>
                  </div>
                  <ArrowUpRight size={14} className="deadline-arrow" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
