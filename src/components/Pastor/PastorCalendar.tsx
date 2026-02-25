'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Ban, Plus } from 'lucide-react'
import MonthView from './MonthView'
import WeekView from './WeekView'
import DayView from './DayView'
import EventModal from './EventModal'
import BlockModal from './BlockModal'
import { useToast } from '@/hooks/useToast'

type ViewType = 'month' | 'week' | 'day'

interface PastorCalendarProps {
  userRole: 'pastor' | 'secretaria' | 'lider'
  userName: string
}

export default function PastorCalendar({ userRole, userName }: PastorCalendarProps) {
  const [view, setView] = useState<ViewType>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [eventModalOpen, setEventModalOpen] = useState(false)
  const [blockModalOpen, setBlockModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const { toast } = useToast()

  const canEdit = userRole === 'pastor' || userRole === 'secretaria'

  const fetchEvents = useCallback(async (date: Date, currentView: ViewType) => {
    // Abort previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const controller = new AbortController()
    abortControllerRef.current = controller

    setLoading(true)
    let start: Date, end: Date

    if (currentView === 'month') {
      start = startOfWeek(startOfMonth(date), { weekStartsOn: 0 })
      end = endOfWeek(endOfMonth(date), { weekStartsOn: 0 })
    } else if (currentView === 'week') {
      start = startOfWeek(date, { weekStartsOn: 0 })
      end = endOfWeek(date, { weekStartsOn: 0 })
    } else {
      start = startOfDay(date)
      end = endOfDay(date)
    }

    try {
      const res = await fetch(
        `/api/pastor-schedule?start=${start.toISOString()}&end=${end.toISOString()}`,
        { credentials: 'include', signal: controller.signal }
      )
      if (res.ok) {
        const data = await res.json()
        setEvents(data)
      } else {
        toast('Erro ao carregar compromissos.', 'error')
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      toast('Erro ao carregar compromissos.', 'error')
    }
    setLoading(false)
  }, [toast])

  useEffect(() => {
    fetchEvents(currentDate, view)
  }, [currentDate, view, fetchEvents])

  const navigate = (direction: 'prev' | 'next' | 'today') => {
    setCurrentDate((prev) => {
      if (direction === 'today') return new Date()
      const next = new Date(prev)
      const delta = direction === 'next' ? 1 : -1
      if (view === 'month') next.setMonth(next.getMonth() + delta)
      else if (view === 'week') next.setDate(next.getDate() + delta * 7)
      else next.setDate(next.getDate() + delta)
      return next
    })
  }

  const getPeriodTitle = () => {
    if (view === 'month') return format(currentDate, 'MMMM yyyy', { locale: ptBR })
    if (view === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 })
      const end = endOfWeek(currentDate, { weekStartsOn: 0 })
      if (start.getMonth() === end.getMonth()) {
        return `${format(start, 'd')}–${format(end, 'd')} de ${format(start, 'MMMM yyyy', { locale: ptBR })}`
      }
      return `${format(start, 'd MMM', { locale: ptBR })} – ${format(end, 'd MMM yyyy', { locale: ptBR })}`
    }
    return format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR })
  }

  const handleSlotClick = (start: Date, end: Date) => {
    if (!canEdit) return
    setSelectedSlot({ start, end })
    setSelectedEvent(null)
    setEventModalOpen(true)
  }

  const handleEventClick = (event: any) => {
    setSelectedEvent(event)
    setSelectedSlot(null)
    setEventModalOpen(true)
  }

  const handleSaveEvent = async (data: any) => {
    const method = selectedEvent ? 'PATCH' : 'POST'
    const url = selectedEvent
      ? `/api/pastor-schedule/${selectedEvent.id}`
      : '/api/pastor-schedule'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      })
      if (res.ok) {
        toast('Compromisso salvo.', 'success')
        setEventModalOpen(false)
        fetchEvents(currentDate, view)
      } else {
        toast('Erro ao salvar compromisso.', 'error')
      }
    } catch {
      toast('Erro ao salvar compromisso.', 'error')
    }
  }

  const handleDeleteEvent = async (id: string) => {
    try {
      const res = await fetch(`/api/pastor-schedule/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        toast('Compromisso removido.', 'success')
        setEventModalOpen(false)
        fetchEvents(currentDate, view)
      } else {
        toast('Erro ao remover compromisso.', 'error')
      }
    } catch {
      toast('Erro ao remover compromisso.', 'error')
    }
  }

  const handleSaveBlock = async (data: any) => {
    try {
      const res = await fetch('/api/pastor-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...data, type: 'bloqueio' }),
      })
      if (res.ok) {
        toast('Bloqueio criado.', 'success')
        setBlockModalOpen(false)
        fetchEvents(currentDate, view)
      } else {
        toast('Erro ao criar bloqueio.', 'error')
      }
    } catch {
      toast('Erro ao criar bloqueio.', 'error')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* CONTROLES DO CALENDÁRIO */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-3 md:flex-wrap">
        {/* Navegação + Título */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('prev')}
            className="w-8 h-8 rounded-lg border border-brand-border bg-brand-white text-brand-muted hover:bg-brand-bg flex items-center justify-center transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => navigate('next')}
            className="w-8 h-8 rounded-lg border border-brand-border bg-brand-white text-brand-muted hover:bg-brand-bg flex items-center justify-center transition-colors"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => navigate('today')}
            className="px-3 h-8 rounded-lg border border-brand-border bg-brand-white text-brand-muted hover:bg-brand-bg text-xs font-medium transition-colors"
          >
            Hoje
          </button>
          <h2 className="font-serif text-lg md:text-xl text-brand-text capitalize ml-1 truncate">
            {getPeriodTitle()}
          </h2>
        </div>

        {/* Tabs de visão + Ações */}
        <div className="flex items-center gap-2 flex-wrap md:ml-auto">
          <div className="flex bg-brand-bg border border-brand-border rounded-lg p-0.5 gap-0.5">
            {(['month', 'week', 'day'] as ViewType[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  view === v
                    ? 'bg-brand-white text-brand-text shadow-sm'
                    : 'text-brand-muted hover:text-brand-text'
                }`}
              >
                {v === 'month' ? 'Mês' : v === 'week' ? 'Semana' : 'Dia'}
              </button>
            ))}
          </div>

          {canEdit && (
            <>
              <button
                onClick={() => setBlockModalOpen(true)}
                className="px-3 py-1.5 rounded-lg border border-brand-border bg-brand-white text-brand-muted hover:bg-brand-bg text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <Ban size={14} /> <span className="hidden sm:inline">Bloquear período</span>
              </button>
              <button
                onClick={() => {
                  setSelectedEvent(null)
                  setSelectedSlot(null)
                  setEventModalOpen(true)
                }}
                className="px-3 py-1.5 rounded-lg bg-brand-text text-white hover:bg-stone-800 text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <Plus size={14} /> <span className="hidden sm:inline">Novo compromisso</span>
              </button>
            </>
          )}
          <span
            className={`hidden sm:inline text-xs font-semibold px-2 py-1 rounded-full ${
              canEdit
                ? 'bg-brand-accentL text-brand-accent'
                : 'bg-brand-bg text-brand-muted border border-brand-border'
            }`}
          >
            {canEdit ? 'Acesso total' : 'Somente leitura'}
          </span>
        </div>
      </div>

      {/* VISÕES */}
      <div className="relative">
        {/* LOADING INDICATOR — absolute overlay, no layout shift */}
        <div
          className={`absolute top-0 left-0 right-0 h-0.5 z-30 rounded-full bg-brand-accent transition-opacity duration-200 ${loading ? 'opacity-100 animate-pulse' : 'opacity-0'}`}
        />

        {/* Opacity fade during loading, render only active view */}
        <div style={{ opacity: loading ? 0.6 : 1 }} className="transition-opacity duration-200">
          {view === 'month' && (
            <MonthView
              currentDate={currentDate}
              events={events}
              onEventClick={handleEventClick}
              onSlotClick={handleSlotClick}
              canEdit={canEdit}
            />
          )}
          {view === 'week' && (
            <WeekView
              currentDate={currentDate}
              events={events}
              onEventClick={handleEventClick}
              onSlotClick={handleSlotClick}
              canEdit={canEdit}
              active
            />
          )}
          {view === 'day' && (
            <DayView
              currentDate={currentDate}
              events={events}
              onEventClick={handleEventClick}
              onSlotClick={handleSlotClick}
              canEdit={canEdit}
              active
            />
          )}
        </div>
      </div>

      {/* LEGENDA */}
      <div className="flex gap-4 flex-wrap mt-1">
        {[
          { label: 'Reunião', color: '#2563EB' },
          { label: 'Aconselhamento', color: '#7C3AED' },
          { label: 'Pregação', color: '#16A34A' },
          { label: 'Viagem', color: '#D97706' },
          { label: 'Pessoal', color: '#78716C' },
          { label: 'Bloqueado', color: '#DC2626' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-brand-muted">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: color }} />
            {label}
          </div>
        ))}
      </div>

      {/* MODAIS */}
      <EventModal
        open={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        event={selectedEvent}
        initialSlot={selectedSlot}
        canEdit={canEdit}
      />
      <BlockModal
        open={blockModalOpen}
        onClose={() => setBlockModalOpen(false)}
        onSave={handleSaveBlock}
      />
    </div>
  )
}
