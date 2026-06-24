import { Target, Flame, Plus, CheckCircle2, Sparkles } from 'lucide-react'
import { useState } from 'react'
import './Habits.css'

const DEMO_HABITS = [
  {
    id: '1',
    name: 'Morning Exercise',
    emoji: '🏋️',
    streak: 12,
    frequency: 'daily',
    completedToday: true,
    weekLog: [true, true, true, false, true, true, true],
    aiInsight: 'Great consistency! You exercise best on weekdays.',
  },
  {
    id: '2',
    name: 'Read 30 Minutes',
    emoji: '📚',
    streak: 8,
    frequency: 'daily',
    completedToday: false,
    weekLog: [true, true, false, true, true, false, true],
    aiInsight: 'Try reading right after lunch — your completion rate is 90% at that time.',
  },
  {
    id: '3',
    name: 'Drink 8 Glasses of Water',
    emoji: '💧',
    streak: 5,
    frequency: 'daily',
    completedToday: true,
    weekLog: [true, false, true, true, true, true, true],
    aiInsight: 'Your hydration improved 40% this week. Keep it up!',
  },
  {
    id: '4',
    name: 'Meditate',
    emoji: '🧘',
    streak: 3,
    frequency: 'daily',
    completedToday: false,
    weekLog: [false, true, false, true, false, true, false],
    aiInsight: 'Try pairing meditation with your morning routine for better consistency.',
  },
]

const DAYS_SHORT = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export default function Habits() {
  const [habits] = useState(DEMO_HABITS)

  const totalStreak = Math.max(...habits.map(h => h.streak))
  const completionRate = Math.round(
    (habits.filter(h => h.completedToday).length / habits.length) * 100
  )

  return (
    <div className="habits-page">
      <div className="habits-header animate-fade-up">
        <Target size={20} style={{ color: 'var(--purple)' }} />
        <h2>Habit Tracker</h2>
        <button className="btn btn-primary btn-sm">
          <Plus size={14} /> New Habit
        </button>
      </div>

      {/* Stats */}
      <div className="habits-stats animate-fade-up delay-1">
        <div className="habit-stat">
          <Flame size={20} style={{ color: 'var(--orange)' }} />
          <span className="hs-value">{totalStreak}</span>
          <span className="hs-label">Best Streak</span>
        </div>
        <div className="habit-stat">
          <CheckCircle2 size={20} style={{ color: 'var(--green)' }} />
          <span className="hs-value">{completionRate}%</span>
          <span className="hs-label">Today's Rate</span>
        </div>
        <div className="habit-stat">
          <Target size={20} style={{ color: 'var(--purple)' }} />
          <span className="hs-value">{habits.length}</span>
          <span className="hs-label">Active Habits</span>
        </div>
      </div>

      {/* Habit Cards */}
      <div className="habits-grid">
        {habits.map((habit, index) => (
          <div key={habit.id} className={`habit-card animate-fade-up delay-${index + 1}`}>
            <div className="habit-card-top">
              <div className="habit-emoji">{habit.emoji}</div>
              <div className="habit-info">
                <h4>{habit.name}</h4>
                <span className="habit-freq">{habit.frequency}</span>
              </div>
              <div className={`habit-check ${habit.completedToday ? 'checked' : ''}`}>
                {habit.completedToday ? <CheckCircle2 size={20} /> : <div className="habit-circle"></div>}
              </div>
            </div>

            {/* Week Heatmap */}
            <div className="habit-week">
              {DAYS_SHORT.map((day, i) => (
                <div key={i} className="habit-day-col">
                  <div className={`habit-day-dot ${habit.weekLog[i] ? 'filled' : ''}`}></div>
                  <span className="habit-day-label">{day}</span>
                </div>
              ))}
            </div>

            <div className="habit-streak-row">
              <Flame size={14} style={{ color: 'var(--orange)' }} />
              <span>{habit.streak} day streak</span>
            </div>

            {/* AI Insight */}
            <div className="habit-ai-insight">
              <Sparkles size={12} style={{ color: 'var(--purple)' }} />
              <span>{habit.aiInsight}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
