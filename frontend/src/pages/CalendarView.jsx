import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import './CalendarView.css'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DEMO_EVENTS = {
  25: [{ title: 'Project Report', priority: 'critical', time: '10:00 AM' }],
  26: [
    { title: 'Team Meeting', priority: 'high', time: '2:00 PM' },
    { title: 'Client Call', priority: 'medium', time: '4:00 PM' },
  ],
  27: [{ title: 'Code Review', priority: 'medium', time: '11:00 AM' }],
  28: [{ title: 'Presentation', priority: 'high', time: '9:00 AM' }],
}

const priorityColors = {
  critical: 'var(--red)',
  high: 'var(--pink)',
  medium: 'var(--orange)',
  low: 'var(--green)',
}

export default function CalendarView() {
  const [currentDate] = useState(new Date())
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const today = currentDate.getDate()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="calendar-page">
      <div className="cal-header animate-fade-up">
        <div className="cal-header-left">
          <CalendarDays size={20} style={{ color: 'var(--purple)' }} />
          <h2>{monthName}</h2>
        </div>
        <div className="cal-nav">
          <button className="btn btn-ghost btn-icon"><ChevronLeft size={18} /></button>
          <button className="btn btn-secondary btn-sm">Today</button>
          <button className="btn btn-ghost btn-icon"><ChevronRight size={18} /></button>
        </div>
      </div>

      <div className="cal-grid animate-fade-up delay-1">
        {DAYS.map(d => (
          <div key={d} className="cal-day-header">{d}</div>
        ))}
        {cells.map((day, i) => (
          <div
            key={i}
            className={`cal-cell ${day === today ? 'cal-today' : ''} ${day ? '' : 'cal-empty'}`}
          >
            {day && (
              <>
                <span className="cal-date">{day}</span>
                <div className="cal-events">
                  {DEMO_EVENTS[day]?.map((evt, j) => (
                    <div
                      key={j}
                      className="cal-event"
                      style={{ borderLeftColor: priorityColors[evt.priority] }}
                    >
                      <span className="cal-event-time">{evt.time}</span>
                      <span className="cal-event-title">{evt.title}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
