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

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const priorityColors = {
  critical: 'border-red-500 bg-red-500/10 text-red-500',
  high: 'border-pink-500 bg-pink-500/10 text-pink-500',
  medium: 'border-orange-500 bg-orange-500/10 text-orange-500',
  low: 'border-green-500 bg-green-500/10 text-green-500',
}

export default function CalendarView() {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [tasks, setTasks] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)

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
    setCurrentDate(new Date(year, month - 1, 1))
    setSelectedDay(null)
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
    setSelectedDay(null)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDay(today.getDate())
  }

  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : []

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0 border border-purple-500/30">
            <CalendarDays size={20} className="text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold font-heading">{monthName}</h2>
        </div>
        <div className="flex items-center gap-2 bg-card/50 p-1 rounded-lg border border-border/50 backdrop-blur-sm">
          <Button variant="ghost" size="icon" onClick={goToPrevMonth} className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <ChevronLeft size={18} />
          </Button>
          <Button variant="secondary" size="sm" onClick={goToToday} className="h-8 px-4 text-xs font-semibold bg-background hover:bg-muted border border-border/50">
            Today
          </Button>
          <Button variant="ghost" size="icon" onClick={goToNextMonth} className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <Card className="flex-1 bg-card/50 backdrop-blur-xl border-border/50 shadow-xl overflow-hidden animate-fade-up delay-100">
          <CardContent className="p-0">
            <div className="grid grid-cols-7 border-b border-border/50 bg-muted/30">
              {DAYS.map(d => (
                <div key={d} className="p-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 auto-rows-[minmax(100px,1fr)]">
              {cells.map((day, i) => {
                const events = day ? getEventsForDay(day) : []
                const isToday = isCurrentMonth && day === today.getDate()
                const isSelected = day === selectedDay

                return (
                  <div
                    key={i}
                    onClick={() => day && setSelectedDay(day)}
                    className={cn(
                      "min-h-[100px] border-r border-b border-border/20 p-2 transition-all duration-200 cursor-pointer relative group",
                      !day && "bg-muted/10 cursor-default",
                      day && "hover:bg-muted/50",
                      isToday && "bg-purple-500/5",
                      isSelected && "ring-2 ring-inset ring-purple-500 bg-purple-500/10 z-10"
                    )}
                  >
                    {day && (
                      <>
                        <span className={cn(
                          "inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold mb-2 transition-colors",
                          isToday ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30" : "text-muted-foreground group-hover:text-foreground",
                          isSelected && !isToday && "bg-background text-foreground"
                        )}>
                          {day}
                        </span>
                        <div className="flex flex-col gap-1 overflow-hidden">
                          {events.slice(0, 3).map((evt, j) => (
                            <div
                              key={j}
                              className={cn(
                                "text-[10px] truncate px-1.5 py-0.5 rounded border-l-2 font-medium bg-background/50",
                                priorityColors[evt.priority] || priorityColors.medium
                              )}
                            >
                              <span className="opacity-70 mr-1">{evt.time}</span>
                              {evt.title}
                            </div>
                          ))}
                          {events.length > 3 && (
                            <span className="text-[10px] font-semibold text-muted-foreground pl-1 mt-0.5">
                              +{events.length - 3} more
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Day Detail Panel */}
        {selectedDay && (
          <Card className="w-full lg:w-80 h-fit bg-card/80 backdrop-blur-xl border-border/50 shadow-2xl animate-fade-up">
            <CardHeader className="pb-4 border-b border-border/50">
              <CardTitle className="text-lg">
                {new Date(year, month, selectedDay).toLocaleDateString('en-US', {
                  weekday: 'long', month: 'short', day: 'numeric'
                })}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {selectedDayEvents.length === 0 ? (
                <div className="p-8 flex flex-col items-center justify-center text-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Sparkles size={20} className="text-purple-400/50" />
                  </div>
                  <p className="text-sm text-muted-foreground">No tasks scheduled for this day</p>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-border/50 max-h-[500px] overflow-y-auto">
                  {selectedDayEvents.map((evt, i) => (
                    <div key={i} className="flex flex-col gap-2 p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-foreground truncate">{evt.title}</span>
                        <Badge variant="outline" className={cn("text-[10px] h-5", priorityColors[evt.priority] || priorityColors.medium)}>
                          {evt.priority?.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground mt-1">
                        <span className="flex items-center gap-1.5">
                          <div className={cn("w-1.5 h-1.5 rounded-full", (priorityColors[evt.priority] || priorityColors.medium).split(' ')[1].replace('bg-', '').replace('/10', 'bg-'))} />
                          {evt.time}
                        </span>
                        <span className="bg-background px-1.5 py-0.5 rounded border border-border/50">~{evt.estimatedHours || 1}h</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
