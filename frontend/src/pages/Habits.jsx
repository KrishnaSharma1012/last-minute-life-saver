import { Target, Flame, Plus, CheckCircle2, Sparkles, Loader2, Trash2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import {
  collection, query, where, onSnapshot, addDoc, updateDoc,
  doc, deleteDoc, serverTimestamp, arrayUnion,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import './Habits.css'

const DAYS_SHORT = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const EMOJI_OPTIONS = ['🏋️', '📚', '💧', '🧘', '🏃', '💻', '🎨', '🎯', '✍️', '🥗']

export default function Habits() {
  const { user, userProfile, updateProfile } = useAuth()
  const [habits, setHabits] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newHabit, setNewHabit] = useState({ name: '', emoji: '🎯', frequency: 'daily' })
  const [saving, setSaving] = useState(false)

  // Fetch habits from Firestore
  useEffect(() => {
    if (!user) return

    const q = query(
      collection(db, 'habits'),
      where('userId', '==', user.uid),
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const habitList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      setHabits(habitList)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  // Check if habit is completed today
  const isCompletedToday = (habit) => {
    const today = new Date().toDateString()
    return habit.completionLog?.some(log => {
      const logDate = log?.toDate ? log.toDate() : new Date(log)
      return logDate.toDateString() === today
    })
  }

  // Get week completion log (last 7 days)
  const getWeekLog = (habit) => {
    const log = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toDateString()
      const completed = habit.completionLog?.some(l => {
        const logDate = l?.toDate ? l.toDate() : new Date(l)
        return logDate.toDateString() === dateStr
      })
      log.push(completed)
    }
    return log
  }

  // Complete habit for today
  const completeHabit = async (habitId, habit) => {
    if (isCompletedToday(habit)) {
      toast('Already completed today! ✅', { icon: '🎉' })
      return
    }

    try {
      const habitRef = doc(db, 'habits', habitId)
      const newStreak = (habit.streak || 0) + 1

      await updateDoc(habitRef, {
        completionLog: arrayUnion(new Date().toISOString()),
        streak: newStreak,
        updatedAt: serverTimestamp(),
      })

      // Award XP for habit completion
      const xpGain = 5
      const newXp = (userProfile?.xp || 0) + xpGain
      const newLevel = Math.floor(newXp / 100) + 1
      await updateProfile({ xp: newXp, level: newLevel })

      toast.success(`✅ Habit completed! +${xpGain} XP`)
    } catch (error) {
      console.error('Error completing habit:', error)
      toast.error('Failed to complete habit')
    }
  }

  // Create new habit
  const createHabit = async () => {
    if (!newHabit.name.trim()) {
      toast.error('Habit name is required')
      return
    }

    setSaving(true)
    try {
      await addDoc(collection(db, 'habits'), {
        userId: user.uid,
        name: newHabit.name.trim(),
        emoji: newHabit.emoji,
        frequency: newHabit.frequency,
        streak: 0,
        completionLog: [],
        aiInsight: '',
        createdAt: serverTimestamp(),
      })

      toast.success('🎯 New habit created!')
      setNewHabit({ name: '', emoji: '🎯', frequency: 'daily' })
      setShowNewForm(false)
    } catch (error) {
      console.error('Error creating habit:', error)
      toast.error('Failed to create habit')
    } finally {
      setSaving(false)
    }
  }

  // Delete habit
  const deleteHabit = async (habitId) => {
    try {
      await deleteDoc(doc(db, 'habits', habitId))
      toast.success('Habit removed')
    } catch (error) {
      console.error('Error deleting habit:', error)
      toast.error('Failed to delete habit')
    }
  }

  const totalStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak || 0)) : 0
  const completedTodayCount = habits.filter(h => isCompletedToday(h)).length
  const completionRate = habits.length > 0
    ? Math.round((completedTodayCount / habits.length) * 100)
    : 0

  if (loading) {
    return (
      <div className="habits-page">
        <div className="task-loading">
          <div className="loading-spinner" />
          <p>Loading habits...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="habits-page">
      <div className="habits-header animate-fade-up">
        <Target size={20} style={{ color: 'var(--purple)' }} />
        <h2>Habit Tracker</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowNewForm(!showNewForm)}>
          <Plus size={14} /> New Habit
        </button>
      </div>

      {/* New Habit Form */}
      {showNewForm && (
        <div className="new-habit-form animate-fade-up">
          <div className="nhf-emoji-row">
            {EMOJI_OPTIONS.map(e => (
              <button
                key={e}
                className={`emoji-btn ${newHabit.emoji === e ? 'selected' : ''}`}
                onClick={() => setNewHabit(prev => ({ ...prev, emoji: e }))}
              >
                {e}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Habit name (e.g., Read 30 minutes)"
            value={newHabit.name}
            onChange={(e) => setNewHabit(prev => ({ ...prev, name: e.target.value }))}
            className="nhf-input"
            id="new-habit-name"
          />
          <div className="nhf-actions">
            <select
              value={newHabit.frequency}
              onChange={(e) => setNewHabit(prev => ({ ...prev, frequency: e.target.value }))}
              className="nhf-select"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
            <button className="btn btn-primary btn-sm" onClick={createHabit} disabled={saving}>
              {saving ? <Loader2 size={14} className="spin" /> : <Plus size={14} />}
              {saving ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      )}

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
      {habits.length === 0 ? (
        <div className="task-empty animate-fade-up delay-2">
          <Target size={32} style={{ color: 'var(--purple)', opacity: 0.5 }} />
          <h4>No habits yet</h4>
          <p>Start tracking your daily habits to build consistency!</p>
          <button className="btn btn-primary btn-sm" onClick={() => setShowNewForm(true)}>
            <Plus size={14} /> Create First Habit
          </button>
        </div>
      ) : (
        <div className="habits-grid">
          {habits.map((habit, index) => {
            const completed = isCompletedToday(habit)
            const weekLog = getWeekLog(habit)

            return (
              <div key={habit.id} className={`habit-card animate-fade-up delay-${Math.min(index + 1, 4)}`}>
                <div className="habit-card-top">
                  <div className="habit-emoji">{habit.emoji}</div>
                  <div className="habit-info">
                    <h4>{habit.name}</h4>
                    <span className="habit-freq">{habit.frequency}</span>
                  </div>
                  <button
                    className={`habit-check ${completed ? 'checked' : ''}`}
                    onClick={() => completeHabit(habit.id, habit)}
                  >
                    {completed ? <CheckCircle2 size={20} /> : <div className="habit-circle"></div>}
                  </button>
                </div>

                {/* Week Heatmap */}
                <div className="habit-week">
                  {DAYS_SHORT.map((day, i) => (
                    <div key={i} className="habit-day-col">
                      <div className={`habit-day-dot ${weekLog[i] ? 'filled' : ''}`}></div>
                      <span className="habit-day-label">{day}</span>
                    </div>
                  ))}
                </div>

                <div className="habit-streak-row">
                  <Flame size={14} style={{ color: 'var(--orange)' }} />
                  <span>{habit.streak || 0} day streak</span>
                </div>

                {/* AI Insight */}
                {habit.aiInsight && (
                  <div className="habit-ai-insight">
                    <Sparkles size={12} style={{ color: 'var(--purple)' }} />
                    <span>{habit.aiInsight}</span>
                  </div>
                )}

                <button className="habit-delete-btn" onClick={() => deleteHabit(habit.id)} title="Delete habit">
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
