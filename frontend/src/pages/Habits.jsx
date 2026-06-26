import { Target, Flame, Plus, CheckCircle2, Sparkles, Loader2, Trash2, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import {
  collection, query, where, onSnapshot, addDoc, updateDoc,
  doc, deleteDoc, serverTimestamp, arrayUnion,
} from 'firebase/firestore'
import { db, isDemoMode } from '../config/firebase'
import { getDemoHabits, addDemoHabit, updateDemoHabit, deleteDemoHabit } from '../data/demoStore'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from '@/lib/utils'

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

    if (isDemoMode) {
      setHabits(getDemoHabits())
      setLoading(false)
      return
    }

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
      toast.info('Already completed today! 🎉')
      return
    }

    try {
      const newStreak = (habit.streak || 0) + 1

      if (isDemoMode) {
        updateDemoHabit(habitId, {
          completionLog: [...(habit.completionLog || []), new Date().toISOString()],
          streak: newStreak,
        })
        setHabits(getDemoHabits())
      } else {
        const habitRef = doc(db, 'habits', habitId)
        await updateDoc(habitRef, {
          completionLog: arrayUnion(new Date().toISOString()),
          streak: newStreak,
          updatedAt: serverTimestamp(),
        })
      }

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
      if (isDemoMode) {
        addDemoHabit({
          userId: user.uid,
          name: newHabit.name.trim(),
          emoji: newHabit.emoji,
          frequency: newHabit.frequency,
        })
        setHabits(getDemoHabits())
      } else {
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
      }

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
      if (isDemoMode) {
        deleteDemoHabit(habitId)
        setHabits(getDemoHabits())
      } else {
        await deleteDoc(doc(db, 'habits', habitId))
      }
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
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
        <p className="text-muted-foreground">Loading habits...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0 border border-purple-500/30">
            <Target size={20} className="text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold font-heading">Habit Tracker</h2>
        </div>
        <Button 
          onClick={() => setShowNewForm(!showNewForm)}
          className="bg-purple-600 hover:bg-purple-700 text-white gap-2 shadow-lg shadow-purple-500/25"
        >
          {showNewForm ? <X size={16} /> : <Plus size={16} />}
          {showNewForm ? 'Cancel' : 'New Habit'}
        </Button>
      </div>

      {/* New Habit Form */}
      {showNewForm && (
        <Card className="bg-card/80 backdrop-blur-xl border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.15)] animate-fade-up">
          <CardContent className="p-6 flex flex-col gap-6">
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map(e => (
                <button
                  key={e}
                  className={cn(
                    "w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all duration-200 border",
                    newHabit.emoji === e 
                      ? "bg-purple-500/20 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)] scale-110" 
                      : "bg-background/50 border-border/50 hover:bg-muted/50 hover:border-border"
                  )}
                  onClick={() => setNewHabit(prev => ({ ...prev, emoji: e }))}
                >
                  {e}
                </button>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                type="text"
                placeholder="Habit name (e.g., Read 30 minutes)"
                value={newHabit.name}
                onChange={(e) => setNewHabit(prev => ({ ...prev, name: e.target.value }))}
                className="flex-1 text-lg bg-background/50 focus-visible:ring-purple-500/50"
                id="new-habit-name"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && createHabit()}
              />
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Select value={newHabit.frequency} onValueChange={(val) => setNewHabit(prev => ({ ...prev, frequency: val }))}>
                  <SelectTrigger className="w-[120px] bg-background/50">
                    <SelectValue placeholder="Frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={createHabit} 
                  disabled={saving}
                  className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700"
                >
                  {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Plus size={16} className="mr-2" />}
                  {saving ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-up delay-75">
        <Card className="bg-card/50 backdrop-blur-xl border-border/50">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
              <Flame size={24} className="text-orange-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold font-heading">{totalStreak}</span>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Best Streak</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-xl border-border/50">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
              <CheckCircle2 size={24} className="text-green-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold font-heading">{completionRate}%</span>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Today's Rate</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-xl border-border/50">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
              <Target size={24} className="text-purple-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold font-heading">{habits.length}</span>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Habits</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Habit Cards */}
      {habits.length === 0 ? (
        <Card className="bg-card/30 border-dashed border-2 border-border/50 animate-fade-up delay-150">
          <CardContent className="p-12 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center">
              <Target size={32} className="text-purple-400/50" />
            </div>
            <div className="flex flex-col gap-1">
              <h4 className="text-xl font-bold">No habits yet</h4>
              <p className="text-muted-foreground">Start tracking your daily habits to build consistency!</p>
            </div>
            <Button onClick={() => setShowNewForm(true)} className="mt-2" variant="outline">
              <Plus size={16} className="mr-2" /> Create First Habit
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {habits.map((habit, index) => {
            const completed = isCompletedToday(habit)
            const weekLog = getWeekLog(habit)

            return (
              <Card 
                key={habit.id} 
                className={cn(
                  "bg-card/60 backdrop-blur-xl border-border/50 shadow-lg transition-all duration-300 relative group overflow-hidden",
                  completed && "border-green-500/30 bg-green-500/5 shadow-[0_0_20px_rgba(34,197,94,0.1)]",
                  `animate-fade-up delay-${Math.min(index + 1, 4) * 100}`
                )}
              >
                {/* Delete button (shows on hover) */}
                <button
                  onClick={() => deleteHabit(habit.id)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-white"
                  title="Delete habit"
                >
                  <Trash2 size={14} />
                </button>

                <CardContent className="p-6 flex flex-col gap-5">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl text-2xl flex items-center justify-center shrink-0 border shadow-inner transition-colors",
                      completed ? "bg-green-500/20 border-green-500/30" : "bg-background/80 border-border/50"
                    )}>
                      {habit.emoji}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0 pr-8">
                      <h4 className="font-bold text-lg truncate leading-tight mb-1">{habit.name}</h4>
                      <Badge variant="secondary" className="w-fit text-[10px] uppercase tracking-wider py-0 px-1.5 h-4">
                        {habit.frequency}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Button
                      variant={completed ? "default" : "outline"}
                      className={cn(
                        "w-full h-12 gap-2 transition-all duration-300",
                        completed 
                          ? "bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/25" 
                          : "hover:border-purple-500/50 hover:bg-purple-500/5 hover:text-purple-400"
                      )}
                      onClick={() => completeHabit(habit.id, habit)}
                    >
                      {completed ? (
                        <><CheckCircle2 size={18} /> Completed Today</>
                      ) : (
                        <><div className="w-4 h-4 rounded-full border-2 border-current" /> Mark Complete</>
                      )}
                    </Button>
                  </div>

                  {/* Week Heatmap */}
                  <div className="flex items-center justify-between bg-background/50 p-3 rounded-lg border border-border/50">
                    {DAYS_SHORT.map((day, i) => (
                      <div key={i} className="flex flex-col items-center gap-1.5">
                        <div className={cn(
                          "w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold transition-colors",
                          weekLog[i] 
                            ? "bg-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.4)]" 
                            : "bg-muted text-muted-foreground"
                        )}>
                          {weekLog[i] && <CheckCircle2 size={12} strokeWidth={3} />}
                        </div>
                        <span className="text-[9px] font-bold text-muted-foreground">{day}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 font-semibold text-orange-500">
                        <Flame size={16} /> {habit.streak || 0} day streak
                      </span>
                    </div>

                    {/* AI Insight */}
                    {habit.aiInsight && (
                      <div className="flex items-start gap-2 bg-purple-500/5 p-2.5 rounded-lg border border-purple-500/10 mt-1">
                        <Sparkles size={14} className="text-purple-400 mt-0.5 shrink-0" />
                        <span className="text-xs font-medium text-purple-200 leading-snug">{habit.aiInsight}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
