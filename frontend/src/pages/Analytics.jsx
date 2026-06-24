import { BarChart3, TrendingUp, CheckCircle2, Clock, Sparkles, Zap } from 'lucide-react'
import './Analytics.css'

const WEEKLY_DATA = [
  { day: 'Mon', completed: 6, total: 8 },
  { day: 'Tue', completed: 5, total: 7 },
  { day: 'Wed', completed: 8, total: 9 },
  { day: 'Thu', completed: 4, total: 6 },
  { day: 'Fri', completed: 7, total: 8 },
  { day: 'Sat', completed: 3, total: 4 },
  { day: 'Sun', completed: 2, total: 3 },
]

const INSIGHTS = [
  { icon: '🎯', title: 'Best Day', value: 'Wednesday', desc: 'You complete 89% of tasks on Wednesdays' },
  { icon: '⏰', title: 'Peak Hours', value: '10 AM - 12 PM', desc: 'Your most productive window' },
  { icon: '📈', title: 'This Week', value: '+12%', desc: 'Improvement over last week' },
  { icon: '🏆', title: 'Longest Streak', value: '15 days', desc: 'Personal best achieved last month' },
]

export default function Analytics() {
  const maxVal = Math.max(...WEEKLY_DATA.map(d => d.total))

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
          <div className="ov-value">35</div>
          <div className="ov-label">Tasks Completed</div>
          <div className="ov-change positive">+8 this week</div>
        </div>
        <div className="overview-card">
          <div className="ov-icon" style={{ background: 'var(--purple-soft)' }}>
            <TrendingUp size={20} style={{ color: 'var(--purple)' }} />
          </div>
          <div className="ov-value">87%</div>
          <div className="ov-label">Completion Rate</div>
          <div className="ov-change positive">+5% vs last week</div>
        </div>
        <div className="overview-card">
          <div className="ov-icon" style={{ background: 'var(--orange-soft)' }}>
            <Clock size={20} style={{ color: 'var(--orange)' }} />
          </div>
          <div className="ov-value">4.2h</div>
          <div className="ov-label">Avg Focus Time</div>
          <div className="ov-change positive">+0.5h improvement</div>
        </div>
        <div className="overview-card">
          <div className="ov-icon" style={{ background: 'var(--blue-soft)' }}>
            <Zap size={20} style={{ color: 'var(--blue)' }} />
          </div>
          <div className="ov-value">12</div>
          <div className="ov-label">Day Streak</div>
          <div className="ov-change">3 more to beat record!</div>
        </div>
      </div>

      {/* Chart + Insights Grid */}
      <div className="analytics-grid">
        {/* Weekly Chart */}
        <div className="chart-card animate-fade-up delay-2">
          <h3 className="section-title-sm">Weekly Task Completion</h3>
          <div className="bar-chart">
            {WEEKLY_DATA.map((d, i) => (
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
            {INSIGHTS.map((insight, i) => (
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
        </div>
      </div>
    </div>
  )
}
