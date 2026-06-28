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
import { motion, AnimatePresence } from 'framer-motion'

const DAYS_SHORT = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const EMOJI_OPTIONS = ['🏋️', '📚', '💧', '🧘', '🏃', '💻', '🎨', '🎯', '✍️', '🥗']

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

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
    <motion.div
      className="flex flex-col gap-6 max-w-6xl mx-auto w-full"
      variants={stagger}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center shrink-0 border border-purple-500/20 glow-purple">
            <Target size={20} className="text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold font-heading">Habit Tracker</h2>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={() => setShowNewForm(!showNewForm)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white gap-2 shadow-lg shadow-purple-500/25 transition-all hover:shadow-purple-500/35 hover:-translate-y-0.5 group"
          >
            {showNewForm ? <X size={16} /> : <Plus size={16} className="transition-transform group-hover:rotate-90 duration-300" />}
            {showNewForm ? 'Cancel' : 'New Habit'}
          </Button>
        </motion.div>
      </motion.div>

      {/* New Habit Form */}
      <AnimatePresence>
        {showNewForm && (
          <motion.div
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <Card className="glass-strong border-purple-500/20 shadow-[0_0_30px_rgba(124,111,255,0.1)] overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400" />
              <CardContent className="p-6 flex flex-col gap-6">
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map(e => (
                    <motion.button
                      key={e}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      className={cn(
                        "w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all duration-200 border",
                        newHabit.emoji === e
                          ? "bg-purple-500/20 border-purple-500/40 shadow-[0_0_15px_rgba(124,111,255,0.3)] scale-110"
                          : "glass-light border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1]"
                      )}
                      onClick={() => setNewHabit(prev => ({ ...prev, emoji: e }))}
                    >
                      {e}
                    </motion.button>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Input
                    type="text"
                    placeholder="Habit name (e.g., Read 30 minutes)"
                    value={newHabit.name}
                    onChange={(e) => setNewHabit(prev => ({ ...prev, name: e.target.value }))}
                    className="flex-1 text-lg glass-light border-white/[0.06] focus-visible:ring-purple-500/30 focus-visible:border-purple-500/20"
                    id="new-habit-name"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && createHabit()}
                  />
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Select value={newHabit.frequency} onValueChange={(val) => setNewHabit(prev => ({ ...prev, frequency: val }))}>
                      <SelectTrigger className="w-[120px] glass-light border-white/[0.06]">
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
                      className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20"
                    >
                      {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Plus size={16} className="mr-2" />}
                      {saving ? 'Creating...' : 'Create'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Flame, color: 'orange', value: totalStreak, label: 'Best Streak' },
          { icon: CheckCircle2, color: 'green', value: `${completionRate}%`, label: "Today's Rate" },
          { icon: Target, color: 'purple', value: habits.length, label: 'Active Habits' },
        ].map((stat, i) => (
          <motion.div key={i} variants={fadeUp} whileHover={{ y: -2 }}>
            <Card className="glass-card card-hover border-white/[0.05]">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                  stat.color === 'orange' ? 'bg-orange-500/10' : stat.color === 'green' ? 'bg-green-500/10' : 'bg-purple-500/10'
                )}>
                  <stat.icon size={24} className={cn(
                    stat.color === 'orange' ? 'text-orange-500' : stat.color === 'green' ? 'text-green-500' : 'text-purple-500'
                  )} />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold font-heading">{stat.value}</span>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">{stat.label}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Habit Cards */}
      <AnimatePresence mode="popLayout">
        {habits.length === 0 ? (
          <motion.div
            key="empty"
            variants={fadeUp}
          >
            <Card className="border-dashed border-2 border-white/[0.06] bg-transparent hover:glass-light transition-all cursor-pointer" onClick={() => setShowNewForm(true)}>
              <CardContent className="p-12 flex flex-col items-center justify-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center animate-float">
                  <Target size={32} className="text-purple-400/50" />
                </div>
                <div className="flex flex-col gap-1">
                  <h4 className="text-xl font-bold font-heading">No habits yet</h4>
                  <p className="text-muted-foreground">Start tracking your daily habits to build consistency!</p>
                </div>
                <Button onClick={() => setShowNewForm(true)} variant="outline" className="mt-2 glass-light border-white/[0.06] hover:border-purple-500/20 hover:bg-purple-500/5">
                  <Plus size={16} className="mr-2" /> Create First Habit
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {habits.map((habit, index) => {
              const completed = isCompletedToday(habit)
              const weekLog = getWeekLog(habit)

              return (
                <motion.div
                  key={habit.id}
                  layout
                  variants={fadeUp}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                >
                  <Card
                    className={cn(
                      "glass-card card-hover border-white/[0.05] shadow-xl relative group overflow-hidden",
                      completed && "border-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.08)]"
                    )}
                  >
                    {/* Completion glow overlay */}
                    {completed && (
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500/[0.04] to-transparent pointer-events-none" />
                    )}

                    {/* Delete button (shows on hover) */}
                    <motion.button
                      onClick={() => deleteHabit(habit.id)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-white z-10"
                      title="Delete habit"
                    >
                      <Trash2 size={14} />
                    </motion.button>

                    <CardContent className="p-6 flex flex-col gap-5 relative z-[1]">
                      <div className="flex items-start gap-4">
                        <motion.div
                          whileTap={{ scale: 0.9, rotate: -15 }}
                          className={cn(
                            "w-12 h-12 rounded-xl text-2xl flex items-center justify-center shrink-0 border shadow-inner transition-all duration-300",
                            completed ? "bg-green-500/15 border-green-500/25 shadow-[0_0_12px_rgba(34,197,94,0.15)]" : "glass-light border-white/[0.06]"
                          )}
                        >
                          {habit.emoji}
                        </motion.div>
                        <div className="flex flex-col flex-1 min-w-0 pr-8">
                          <h4 className="font-bold text-lg truncate leading-tight mb-1">{habit.name}</h4>
                          <Badge variant="outline" className="w-fit text-[9px] uppercase tracking-[0.12em] py-0 px-1.5 h-4 glass-light border-white/[0.06] text-muted-foreground/60">
                            {habit.frequency}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <motion.div className="w-full" whileTap={{ scale: 0.98 }}>
                          <Button
                            variant={completed ? "default" : "outline"}
                            className={cn(
                              "w-full h-12 gap-2 transition-all duration-300",
                              completed
                                ? "bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/25"
                                : "glass-light border-white/[0.06] hover:border-purple-500/30 hover:bg-purple-500/5 hover:text-purple-400"
                            )}
                            onClick={() => completeHabit(habit.id, habit)}
                          >
                            {completed ? (
                              <><CheckCircle2 size={18} /> Completed Today</>
                            ) : (
                              <><div className="w-4 h-4 rounded-full border-2 border-current" /> Mark Complete</>
                            )}
                          </Button>
                        </motion.div>
                      </div>

                      {/* Week Heatmap */}
                      <div className="flex items-center justify-between glass-light p-3 rounded-lg border border-white/[0.04]">
                        {DAYS_SHORT.map((day, i) => (
                          <div key={i} className="flex flex-col items-center gap-1.5">
                            <motion.div
                              initial={{ scale: 0.5, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 0.3 + i * 0.04 }}
                              className={cn(
                                "w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold transition-all duration-300",
                                weekLog[i]
                                  ? "bg-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.4)]"
                                  : "bg-white/[0.04] text-muted-foreground/40"
                              )}
                            >
                              {weekLog[i] && <CheckCircle2 size={12} strokeWidth={3} />}
                            </motion.div>
                            <span className="text-[9px] font-bold text-muted-foreground/40">{day}</span>
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
                          <div className="flex items-start gap-2 bg-purple-500/[0.05] p-2.5 rounded-lg border border-purple-500/10 mt-1">
                            <Sparkles size={14} className="text-purple-400 mt-0.5 shrink-0" />
                            <span className="text-[11px] font-medium text-purple-300/80 leading-snug">{habit.aiInsight}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
