import { CalendarDays, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../context/AuthContext'
import './CalendarView.css'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const priorityColors = {
  critical: 'var(--red)',
  high: 'var(--pink)',
  medium: 'var(--orange)',
  low: 'var(--green)',
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
    <div className="calendar-page">
      <div className="cal-header animate-fade-up">
        <div className="cal-header-left">
          <CalendarDays size={20} style={{ color: 'var(--purple)' }} />
          <h2>{monthName}</h2>
        </div>
        <div className="cal-nav">
          <button className="btn btn-ghost btn-icon" onClick={goToPrevMonth}><ChevronLeft size={18} /></button>
          <button className="btn btn-secondary btn-sm" onClick={goToToday}>Today</button>
          <button className="btn btn-ghost btn-icon" onClick={goToNextMonth}><ChevronRight size={18} /></button>
        </div>
      </div>

      <div className="cal-layout">
        <div className="cal-grid animate-fade-up delay-1">
          {DAYS.map(d => (
            <div key={d} className="cal-day-header">{d}</div>
          ))}
          {cells.map((day, i) => {
            const events = day ? getEventsForDay(day) : []
            const isToday = isCurrentMonth && day === today.getDate()
            const isSelected = day === selectedDay

            return (
              <div
                key={i}
                className={`cal-cell ${isToday ? 'cal-today' : ''} ${day ? '' : 'cal-empty'} ${isSelected ? 'cal-selected' : ''}`}
                onClick={() => day && setSelectedDay(day)}
              >
                {day && (
                  <>
                    <span className="cal-date">{day}</span>
                    <div className="cal-events">
                      {events.slice(0, 2).map((evt, j) => (
                        <div
                          key={j}
                          className="cal-event"
                          style={{ borderLeftColor: priorityColors[evt.priority] || priorityColors.medium }}
                        >
                          <span className="cal-event-time">{evt.time}</span>
                          <span className="cal-event-title">{evt.title}</span>
                        </div>
                      ))}
                      {events.length > 2 && (
                        <span className="cal-more">+{events.length - 2} more</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>

        {/* Day Detail Panel */}
        {selectedDay && (
          <div className="cal-detail-panel animate-fade-up">
            <h3 className="cal-detail-title">
              {new Date(year, month, selectedDay).toLocaleDateString('en-US', {
                weekday: 'long', month: 'short', day: 'numeric'
              })}
            </h3>
            {selectedDayEvents.length === 0 ? (
              <div className="cal-detail-empty">
                <Sparkles size={24} style={{ color: 'var(--purple)', opacity: 0.4 }} />
                <p>No tasks scheduled for this day</p>
              </div>
            ) : (
              <div className="cal-detail-list">
                {selectedDayEvents.map((evt, i) => (
                  <div key={i} className="cal-detail-item" style={{ '--priority': priorityColors[evt.priority] || priorityColors.medium }}>
                    <div className="cal-detail-time">{evt.time}</div>
                    <div className="cal-detail-info">
                      <span className="cal-detail-name">{evt.title}</span>
                      <span className="cal-detail-priority">{evt.priority?.toUpperCase()}</span>
                    </div>
                    <span className="cal-detail-hours">~{evt.estimatedHours || 1}h</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
