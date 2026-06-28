import { CalendarDays, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db, isDemoMode } from '../config/firebase'
import { getDemoTasks } from '../data/demoStore'
import { useAuth } from '../context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const priorityColors = {
  critical: 'border-red-500 bg-red-500/10 text-red-400',
  high: 'border-pink-500 bg-pink-500/10 text-pink-400',
  medium: 'border-orange-500 bg-orange-500/10 text-orange-400',
  low: 'border-green-500 bg-green-500/10 text-green-400',
}

export default function CalendarView() {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [tasks, setTasks] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)
  const [direction, setDirection] = useState(0)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  // Fetch tasks from Firestore
  useEffect(() => {
    if (!user) return

    if (isDemoMode) {
      setTasks(getDemoTasks())
      return
    }

    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', user.uid),
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      setTasks(taskList)
    })

    return () => unsubscribe()
  }, [user])

  // Group tasks by day of month
  const getEventsForDay = (day) => {
    return tasks.filter(task => {
      try {
        const deadline = task.deadline?.toDate ? task.deadline.toDate() : new Date(task.deadline)
        return deadline.getFullYear() === year &&
               deadline.getMonth() === month &&
               deadline.getDate() === day
      } catch {
        return false
      }
    }).map(task => {
      const deadline = task.deadline?.toDate ? task.deadline.toDate() : new Date(task.deadline)
      return {
        ...task,
        time: deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    })
  }

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const goToPrevMonth = () => {
    setDirection(-1)
    setCurrentDate(new Date(year, month - 1, 1))
    setSelectedDay(null)
  }

  const goToNextMonth = () => {
    setDirection(1)
    setCurrentDate(new Date(year, month + 1, 1))
    setSelectedDay(null)
  }

  const goToToday = () => {
    setDirection(0)
    setCurrentDate(new Date())
    setSelectedDay(today.getDate())
  }

  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : []

  return (
    <motion.div
      className="flex flex-col gap-6 max-w-6xl mx-auto w-full"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center shrink-0 border border-purple-500/20 glow-purple">
            <CalendarDays size={20} className="text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold font-heading">{monthName}</h2>
        </div>
        <div className="flex items-center gap-2 glass-light p-1 rounded-lg">
          <Button variant="ghost" size="icon" onClick={goToPrevMonth} className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <ChevronLeft size={18} />
          </Button>
          <Button variant="secondary" size="sm" onClick={goToToday} className="h-8 px-4 text-[11px] font-semibold glass-light hover:bg-white/[0.06] border border-white/[0.06]">
            Today
          </Button>
          <Button variant="ghost" size="icon" onClick={goToNextMonth} className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <Card className="flex-1 glass-card border-white/[0.05] shadow-xl overflow-hidden">
          <CardContent className="p-0">
            <div className="grid grid-cols-7 border-b border-white/[0.04] glass-light">
              {DAYS.map(d => (
                <div key={d} className="p-3 text-center text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.15em]">
                  {d}
                </div>
              ))}
            </div>
            <motion.div
              key={`${year}-${month}`}
              initial={{ opacity: 0, x: direction * 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="grid grid-cols-7 auto-rows-[minmax(90px,1fr)]"
            >
              {cells.map((day, i) => {
                const events = day ? getEventsForDay(day) : []
                const isToday = isCurrentMonth && day === today.getDate()
                const isSelected = day === selectedDay

                return (
                  <div
                    key={i}
                    onClick={() => day && setSelectedDay(day)}
                    className={cn(
                      "min-h-[90px] border-r border-b border-white/[0.03] p-2 transition-all duration-200 cursor-pointer relative group",
                      !day && "bg-white/[0.01] cursor-default",
                      day && "hover:bg-white/[0.03]",
                      isToday && "bg-purple-500/[0.04]",
                      isSelected && "ring-2 ring-inset ring-purple-500/50 bg-purple-500/[0.06] z-10"
                    )}
                  >
                    {day && (
                      <>
                        <span className={cn(
                          "inline-flex items-center justify-center w-7 h-7 rounded-full text-[12px] font-semibold mb-1 transition-all",
                          isToday ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30" : "text-muted-foreground/50 group-hover:text-foreground",
                          isSelected && !isToday && "bg-white/[0.06] text-foreground"
                        )}>
                          {day}
                        </span>
                        <div className="flex flex-col gap-0.5 overflow-hidden">
                          {events.slice(0, 2).map((evt, j) => (
                            <div
                              key={j}
                              className={cn(
                                "text-[9px] truncate px-1.5 py-0.5 rounded border-l-2 font-medium glass-light",
                                priorityColors[evt.priority] || priorityColors.medium
                              )}
                            >
                              {evt.title}
                            </div>
                          ))}
                          {events.length > 2 && (
                            <span className="text-[9px] font-semibold text-muted-foreground/40 pl-1">
                              +{events.length - 2} more
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </motion.div>
          </CardContent>
        </Card>

        {/* Day Detail Panel */}
        <AnimatePresence mode="wait">
          {selectedDay && (
            <motion.div
              key={selectedDay}
              initial={{ opacity: 0, x: 20, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card className="w-full lg:w-80 h-fit glass-strong border-white/[0.06] shadow-2xl">
                <CardHeader className="pb-4 border-b border-white/[0.04]">
                  <CardTitle className="text-base font-heading">
                    {new Date(year, month, selectedDay).toLocaleDateString('en-US', {
                      weekday: 'long', month: 'short', day: 'numeric'
                    })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {selectedDayEvents.length === 0 ? (
                    <div className="p-8 flex flex-col items-center justify-center text-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center animate-float">
                        <Sparkles size={18} className="text-purple-400/50" />
                      </div>
                      <p className="text-[13px] text-muted-foreground/50">No tasks scheduled for this day</p>
                    </div>
                  ) : (
                    <div className="flex flex-col divide-y divide-white/[0.04] max-h-[500px] overflow-y-auto">
                      {selectedDayEvents.map((evt, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex flex-col gap-2 p-4 hover:bg-white/[0.02] transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[13px] font-bold text-foreground truncate">{evt.title}</span>
                            <Badge variant="outline" className={cn("text-[9px] h-5", priorityColors[evt.priority] || priorityColors.medium)}>
                              {evt.priority?.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground/50 mt-1">
                            <span>{evt.time}</span>
                            <span className="glass-light px-1.5 py-0.5 rounded text-[10px]">~{evt.estimatedHours || 1}h</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
