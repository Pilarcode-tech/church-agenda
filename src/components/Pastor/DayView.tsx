'use client'

import { useEffect, useRef, useState } from 'react'
import {
  isToday, isSameDay, format, getHours, getMinutes, differenceInMinutes
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface DayViewProps {
  currentDate: Date
  events: any[]
  onEventClick: (event: any) => void
  onSlotClick: (start: Date, end: Date) => void
  canEdit: boolean
  active?: boolean
}

const START_HOUR = 6
const END_HOUR = 22
const HOUR_HEIGHT = 60
const TOTAL_HOURS = END_HOUR - START_HOUR
const TIME_COL_WIDTH = 56

export default function DayView({ currentDate, events, onEventClick, onSlotClick, canEdit, active = true }: DayViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const today = isToday(currentDate)

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

  const dayEvents = events.filter((ev) => isSameDay(new Date(ev.start), currentDate))

  // Calculate stats
  const totalMinutes = dayEvents.reduce((acc, ev) => {
    return acc + differenceInMinutes(new Date(ev.end), new Date(ev.start))
  }, 0)
  const totalHours = Math.round(totalMinutes / 60 * 10) / 10

  function getEventPosition(ev: any) {
    const start = new Date(ev.start)
    const end = new Date(ev.end)
    const startMin = getHours(start) * 60 + getMinutes(start)
    const endMin = getHours(end) * 60 + getMinutes(end)
    const top = (startMin - START_HOUR * 60) * (HOUR_HEIGHT / 60)
    const height = Math.max(20, (endMin - startMin) * (HOUR_HEIGHT / 60))
    return { top, height }
  }

  function resolveOverlaps(dayEvts: any[]) {
    if (dayEvts.length === 0) return []

    const positioned = dayEvts.map((ev) => ({
      ...ev,
      ...getEventPosition(ev),
      column: 0,
      totalColumns: 1,
    }))

    positioned.sort((a, b) => a.top - b.top)

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

  function handleSlotClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!canEdit) return
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const minutes = Math.floor(y / (HOUR_HEIGHT / 60)) + START_HOUR * 60
    const hour = Math.floor(minutes / 60)
    const min = Math.floor((minutes % 60) / 15) * 15

    const start = new Date(currentDate)
    start.setHours(hour, min, 0, 0)
    const end = new Date(start)
    end.setHours(hour + 1, min, 0, 0)

    onSlotClick(start, end)
  }

  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i)
  const positioned = resolveOverlaps(dayEvents)

  return (
    <div className="bg-brand-white border border-brand-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-brand-border">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-medium ${
              today ? 'bg-brand-text text-white' : 'bg-brand-bg text-brand-text'
            }`}
          >
            {format(currentDate, 'd')}
          </div>
          <div>
            <p className="text-sm font-medium text-brand-text capitalize">
              {format(currentDate, 'EEEE', { locale: ptBR })}
            </p>
            <p className="text-[11px] text-brand-dim">
              {format(currentDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>
        <p className="text-xs text-brand-muted">
          {dayEvents.length} compromisso{dayEvents.length !== 1 ? 's' : ''} · {totalHours}h ocupada{totalHours !== 1 ? 's' : ''}
        </p>
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

          {/* Single day column */}
          <div
            className="flex-1 relative border-l border-brand-borderL"
            onClick={handleSlotClick}
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
              const widthPercent = 85 / ev.totalColumns
              const leftPercent = 5 + ev.column * widthPercent

              return (
                <button
                  key={ev.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    onEventClick(ev)
                  }}
                  className={`absolute rounded-md px-2 py-1.5 text-xs font-medium leading-tight overflow-hidden text-left transition-opacity hover:opacity-90 z-10 ${
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
                  <span className="block truncate font-semibold">{ev.title}</span>
                  {ev.height > 30 && (
                    <span className={`block text-[11px] truncate ${isBlock ? 'text-brand-red/60' : 'text-white/75'}`}>
                      {format(new Date(ev.start), 'HH:mm')} – {format(new Date(ev.end), 'HH:mm')}
                    </span>
                  )}
                  {ev.height > 55 && ev.notes && (
                    <span className={`block text-[10px] truncate mt-0.5 ${isBlock ? 'text-brand-red/50' : 'text-white/60'}`}>
                      {ev.notes}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
