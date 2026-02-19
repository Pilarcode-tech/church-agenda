'use client'

import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday, isSameDay, format, setHours
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface MonthViewProps {
  currentDate: Date
  events: any[]
  onEventClick: (event: any) => void
  onSlotClick: (start: Date, end: Date) => void
  canEdit: boolean
}

const WEEKDAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']
const MAX_VISIBLE = 3

export default function MonthView({ currentDate, events, onEventClick, onSlotClick, canEdit }: MonthViewProps) {
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  function getEventsForDay(day: Date) {
    return events.filter((ev) => {
      const evDate = new Date(ev.start)
      return isSameDay(evDate, day)
    })
  }

  function handleDayClick(day: Date) {
    if (!canEdit) return
    const start = setHours(day, 9)
    const end = setHours(day, 10)
    onSlotClick(start, end)
  }

  return (
    <div className="bg-brand-white border border-brand-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-7 border-b border-brand-border">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center py-2.5 text-[11px] font-medium text-brand-dim tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dayEvents = getEventsForDay(day)
          const inMonth = isSameMonth(day, currentDate)
          const today = isToday(day)
          const visibleEvents = dayEvents.slice(0, MAX_VISIBLE)
          const hiddenCount = dayEvents.length - MAX_VISIBLE

          return (
            <div
              key={i}
              onClick={() => handleDayClick(day)}
              className={`min-h-[96px] border-b border-r border-brand-borderL p-1.5 transition-colors ${
                canEdit ? 'cursor-pointer hover:bg-brand-bg' : ''
              } ${!inMonth ? 'opacity-40' : ''}`}
            >
              {/* Day number */}
              <div className="flex justify-end mb-1">
                <span
                  className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                    today
                      ? 'bg-brand-text text-white'
                      : 'text-brand-text'
                  }`}
                >
                  {format(day, 'd')}
                </span>
              </div>

              {/* Events */}
              <div className="space-y-0.5">
                {visibleEvents.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onEventClick(ev)
                    }}
                    className="w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium text-white truncate block leading-tight"
                    style={{ backgroundColor: ev.color }}
                    title={ev.title}
                  >
                    {ev.title}
                  </button>
                ))}
                {hiddenCount > 0 && (
                  <p className="text-[10px] text-brand-dim px-1 leading-tight">
                    +{hiddenCount} mais
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
