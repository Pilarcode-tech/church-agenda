'use client'

import { useEffect, useRef, useState } from 'react'
import {
  startOfWeek, endOfWeek, eachDayOfInterval, isToday, isSameDay,
  format, differenceInMinutes, getHours, getMinutes
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface WeekViewProps {
  currentDate: Date
  events: any[]
  onEventClick: (event: any) => void
  onSlotClick: (start: Date, end: Date) => void
  canEdit: boolean
  active?: boolean
}

const START_HOUR = 6
const END_HOUR = 22
const HOUR_HEIGHT = 60 // px per hour
const TOTAL_HOURS = END_HOUR - START_HOUR
const TIME_COL_WIDTH = 56

export default function WeekView({ currentDate, events, onEventClick, onSlotClick, canEdit, active = true }: WeekViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  // Scroll to current hour when date changes or view becomes active
  useEffect(() => {
    if (!active || !scrollRef.current) return
    const now = new Date()
    const currentHour = getHours(now)
    if (currentHour >= START_HOUR && currentHour <= END_HOUR) {
      scrollRef.current.scrollTop = Math.max(0, (currentHour - START_HOUR - 1) * HOUR_HEIGHT)
    } else {
      scrollRef.current.scrollTop = HOUR_HEIGHT
    }
  }, [currentDate, active])

  function getEventsForDay(day: Date) {
    return events.filter((ev) => {
      const evDate = new Date(ev.start)
      return isSameDay(evDate, day)
    })
  }

  function getEventPosition(ev: any) {
    const start = new Date(ev.start)
    const end = new Date(ev.end)
    const startMin = getHours(start) * 60 + getMinutes(start)
    const endMin = getHours(end) * 60 + getMinutes(end)
    const top = (startMin - START_HOUR * 60) * (HOUR_HEIGHT / 60)
    const height = Math.max(20, (endMin - startMin) * (HOUR_HEIGHT / 60))
    return { top, height }
  }

  function resolveOverlaps(dayEvents: any[]) {
    if (dayEvents.length === 0) return []

    const positioned = dayEvents.map((ev) => ({
      ...ev,
      ...getEventPosition(ev),
      column: 0,
      totalColumns: 1,
    }))

    // Sort by start time
    positioned.sort((a, b) => a.top - b.top)

    // Group overlapping events
    const groups: typeof positioned[] = []
    let currentGroup: typeof positioned = []

    for (const ev of positioned) {
      if (currentGroup.length === 0) {
        currentGroup.push(ev)
        continue
      }

      const lastEnd = Math.max(...currentGroup.map((e) => e.top + e.height))
      if (ev.top < lastEnd) {
        currentGroup.push(ev)
      } else {
        groups.push([...currentGroup])
        currentGroup = [ev]
      }
    }
    if (currentGroup.length > 0) groups.push(currentGroup)

    // Assign columns
    for (const group of groups) {
      for (let i = 0; i < group.length; i++) {
        group[i].column = i
        group[i].totalColumns = group.length
      }
    }

    return positioned
  }

  // Live-updating now indicator
  const [nowTop, setNowTop] = useState(() => {
    const now = new Date()
    const minutes = getHours(now) * 60 + getMinutes(now)
    return (minutes - START_HOUR * 60) * (HOUR_HEIGHT / 60)
  })

  useEffect(() => {
    const update = () => {
      const now = new Date()
      const minutes = getHours(now) * 60 + getMinutes(now)
      setNowTop((minutes - START_HOUR * 60) * (HOUR_HEIGHT / 60))
    }
    const id = setInterval(update, 60_000)
    return () => clearInterval(id)
  }, [])

  function handleSlotClick(day: Date, e: React.MouseEvent<HTMLDivElement>) {
    if (!canEdit) return
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const minutes = Math.floor(y / (HOUR_HEIGHT / 60)) + START_HOUR * 60
    const hour = Math.floor(minutes / 60)
    const min = Math.floor(minutes % 60 / 15) * 15 // snap to 15 min

    const start = new Date(day)
    start.setHours(hour, min, 0, 0)
    const end = new Date(start)
    end.setHours(hour + 1, min, 0, 0)

    onSlotClick(start, end)
  }

  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i)

  return (
    <div className="bg-brand-white border border-brand-border rounded-xl overflow-hidden">
      {/* Day headers */}
      <div className="flex border-b border-brand-border sticky top-0 z-10 bg-brand-white">
        <div style={{ width: TIME_COL_WIDTH }} className="shrink-0" />
        {days.map((day) => {
          const today = isToday(day)
          return (
            <div key={day.toISOString()} className="flex-1 text-center py-2.5 border-l border-brand-borderL">
              <p className="text-[11px] text-brand-dim font-medium tracking-wider uppercase">
                {format(day, 'EEE', { locale: ptBR })}
              </p>
              <p
                className={`text-lg font-medium mt-0.5 w-8 h-8 flex items-center justify-center mx-auto rounded-full ${
                  today ? 'bg-brand-text text-white' : 'text-brand-text'
                }`}
              >
                {format(day, 'd')}
              </p>
            </div>
          )
        })}
      </div>

      {/* Time grid */}
      <div ref={scrollRef} className="overflow-y-auto" style={{ maxHeight: '70vh' }}>
        <div className="flex relative" style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}>
          {/* Time column */}
          <div style={{ width: TIME_COL_WIDTH }} className="shrink-0 relative">
            {hours.map((hour) => (
              <div
                key={hour}
                className="absolute w-full text-right pr-2 text-[11px] text-brand-dim"
                style={{ top: (hour - START_HOUR) * HOUR_HEIGHT - 6 }}
              >
                {String(hour).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const dayEvents = getEventsForDay(day)
            const positioned = resolveOverlaps(dayEvents)
            const today = isToday(day)

            return (
              <div
                key={day.toISOString()}
                className="flex-1 relative border-l border-brand-borderL"
                onClick={(e) => handleSlotClick(day, e)}
              >
                {/* Hour lines */}
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="absolute w-full border-t border-brand-borderL"
                    style={{ top: (hour - START_HOUR) * HOUR_HEIGHT }}
                  />
                ))}

                {/* Now indicator */}
                {today && nowTop >= 0 && nowTop <= TOTAL_HOURS * HOUR_HEIGHT && (
                  <div className="absolute w-full z-20 pointer-events-none" style={{ top: nowTop }}>
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
                      <div className="flex-1 h-[2px] bg-red-500" />
                    </div>
                  </div>
                )}

                {/* Events */}
                {positioned.map((ev) => {
                  const isBlock = ev.type === 'bloqueio'
                  const widthPercent = 90 / ev.totalColumns
                  const leftPercent = 5 + ev.column * widthPercent

                  return (
                    <button
                      key={ev.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onEventClick(ev)
                      }}
                      className={`absolute rounded-md px-1.5 py-1 text-[11px] font-medium leading-tight overflow-hidden text-left transition-opacity hover:opacity-90 z-10 ${
                        isBlock ? 'text-brand-red border border-brand-red/30' : 'text-white'
                      }`}
                      style={{
                        top: ev.top,
                        height: ev.height,
                        width: `${widthPercent}%`,
                        left: `${leftPercent}%`,
                        backgroundColor: isBlock ? undefined : ev.color,
                        background: isBlock
                          ? 'repeating-linear-gradient(45deg, #FEE2E2, #FEE2E2 4px, #fff 4px, #fff 8px)'
                          : undefined,
                      }}
                      title={ev.title}
                    >
                      <span className="block truncate">{ev.title}</span>
                      {ev.height > 30 && (
                        <span className={`block text-[10px] truncate ${isBlock ? 'text-brand-red/60' : 'text-white/75'}`}>
                          {format(new Date(ev.start), 'HH:mm')} – {format(new Date(ev.end), 'HH:mm')}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
