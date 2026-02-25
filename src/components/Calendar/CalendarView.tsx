'use client'

import { useRef, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import ptBrLocale from '@fullcalendar/core/locales/pt-br'
import type { EventClickArg } from '@fullcalendar/core'
import { Modal } from '@/components/ui/Modal'

type CalendarViewProps = {
  eventsUrl?: string
  initialView?: string
  headerControls?: boolean
  spaces?: { id: string; name: string }[]
}

export function CalendarView({
  eventsUrl = '/api/calendar',
  initialView = 'dayGridMonth',
  headerControls = true,
  spaces = [],
}: CalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null)
  const [title, setTitle] = useState('')
  const [currentView, setCurrentView] = useState(initialView)
  const [selectedSpace, setSelectedSpace] = useState('all')
  const [selectedEvent, setSelectedEvent] = useState<any>(null)

  const handleDatesSet = useCallback((arg: { view: { title: string } }) => {
    setTitle(arg.view.title)
  }, [])

  function goTo(direction: 'prev' | 'next' | 'today') {
    const api = calendarRef.current?.getApi()
    if (!api) return
    if (direction === 'prev') api.prev()
    else if (direction === 'next') api.next()
    else api.today()
  }

  function changeView(view: string) {
    const api = calendarRef.current?.getApi()
    if (!api) return
    api.changeView(view)
    setCurrentView(view)
  }

  function handleEventClick(info: EventClickArg) {
    setSelectedEvent({
      title: info.event.title,
      start: info.event.start,
      end: info.event.end,
      ...info.event.extendedProps,
    })
  }

  const eventSourceUrl = selectedSpace === 'all'
    ? eventsUrl
    : `${eventsUrl}?space=${selectedSpace}`

  const views = [
    { key: 'dayGridMonth', label: 'Mês' },
    { key: 'timeGridWeek', label: 'Semana' },
    { key: 'timeGridDay', label: 'Dia' },
  ]

  return (
    <div>
      {headerControls && (
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
          <div className="flex items-center gap-2">
            <button onClick={() => goTo('prev')} className="text-brand-muted hover:text-brand-text px-1"><ChevronLeft size={18} /></button>
            <h2 className="font-serif text-base md:text-lg text-brand-text capitalize min-w-0 text-center truncate">{title}</h2>
            <button onClick={() => goTo('next')} className="text-brand-muted hover:text-brand-text px-1"><ChevronRight size={18} /></button>
            <button
              onClick={() => goTo('today')}
              className="text-xs text-brand-accent border border-brand-accent rounded px-2 py-1 hover:bg-brand-accentL ml-1"
            >
              Hoje
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View tabs */}
            <div className="flex bg-brand-bg rounded-lg p-0.5">
              {views.map((v) => (
                <button
                  key={v.key}
                  onClick={() => changeView(v.key)}
                  className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                    currentView === v.key
                      ? 'bg-brand-white text-brand-text font-medium shadow-sm'
                      : 'text-brand-muted hover:text-brand-text'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>

            {/* Space filter */}
            {spaces.length > 0 && (
              <select
                value={selectedSpace}
                onChange={(e) => setSelectedSpace(e.target.value)}
                className="bg-brand-white border border-brand-border rounded-lg px-3 py-1.5 text-xs text-brand-text outline-none"
              >
                <option value="all">Todos os espaços</option>
                {spaces.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}

      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={initialView}
        locale={ptBrLocale}
        headerToolbar={false}
        events={eventSourceUrl}
        eventClick={handleEventClick}
        eventClassNames="rounded text-xs font-medium cursor-pointer"
        dayMaxEvents={3}
        height="auto"
        datesSet={handleDatesSet}
        allDaySlot={true}
        slotMinTime="06:00:00"
        slotMaxTime="23:00:00"
      />

      {/* Legenda */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-brand-borderL">
        <span className="text-[11px] text-brand-dim">Legenda:</span>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-[#2563EB]" />
          <span className="text-[11px] text-brand-muted">Reservas</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-[#16A34A]" />
          <span className="text-[11px] text-brand-muted">Agenda do Pastor</span>
        </div>
      </div>

      {/* Modal de detalhes */}
      <Modal
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent?.title ?? 'Evento'}
      >
        {selectedEvent && (
          <div className="space-y-3 text-sm">
            {selectedEvent.space && (
              <div>
                <p className="text-brand-dim text-xs">Espaço</p>
                <p className="text-brand-text">{selectedEvent.space}</p>
              </div>
            )}
            {selectedEvent.eventType && (
              <div>
                <p className="text-brand-dim text-xs">Tipo</p>
                <p className="text-brand-text capitalize">{selectedEvent.eventType}</p>
              </div>
            )}
            <div>
              <p className="text-brand-dim text-xs">Horário</p>
              <p className="text-brand-text">
                {selectedEvent.start && new Date(selectedEvent.start).toLocaleString('pt-BR')}
                {selectedEvent.end && ` — ${new Date(selectedEvent.end).toLocaleString('pt-BR')}`}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
