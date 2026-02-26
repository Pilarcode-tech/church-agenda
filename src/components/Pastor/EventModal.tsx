'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { format } from 'date-fns'

interface EventModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: any) => Promise<void>
  onDelete: (id: string) => Promise<void>
  event: any | null
  initialSlot: { start: Date; end: Date } | null
  canEdit: boolean
}

const typeOptions = [
  { value: 'reuniao', label: 'Reunião' },
  { value: 'aconselhamento', label: 'Aconselhamento' },
  { value: 'pregacao', label: 'Pregação' },
  { value: 'viagem', label: 'Viagem' },
  { value: 'pessoal', label: 'Pessoal' },
  { value: 'bloqueio', label: 'Bloqueio' },
]

const typeColors: Record<string, string> = {
  reuniao: '#2563EB',
  aconselhamento: '#7C3AED',
  pregacao: '#16A34A',
  viagem: '#D97706',
  pessoal: '#78716C',
  bloqueio: '#DC2626',
}

function toLocalDatetime(d: Date | string) {
  const date = new Date(d)
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

export default function EventModal({ open, onClose, onSave, onDelete, event, initialSlot, canEdit }: EventModalProps) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState('reuniao')
  const [startDt, setStartDt] = useState('')
  const [endDt, setEndDt] = useState('')
  const [allDay, setAllDay] = useState(false)
  const [isPublic, setIsPublic] = useState(false)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const isEditing = !!event

  useEffect(() => {
    if (event) {
      setTitle(event.title ?? '')
      setType(event.type ?? 'reuniao')
      setStartDt(event.start ? toLocalDatetime(event.start) : '')
      setEndDt(event.end ? toLocalDatetime(event.end) : '')
      setAllDay(event.allDay ?? false)
      setIsPublic(event.isPublic ?? false)
      setNotes(event.notes ?? '')
    } else if (initialSlot) {
      setTitle('')
      setType('reuniao')
      setStartDt(toLocalDatetime(initialSlot.start))
      setEndDt(toLocalDatetime(initialSlot.end))
      setAllDay(initialSlot.start.getHours() === 0 && initialSlot.end.getHours() === 0)
      setIsPublic(false)
      setNotes('')
    } else {
      setTitle('')
      setType('reuniao')
      setStartDt('')
      setEndDt('')
      setAllDay(false)
      setIsPublic(false)
      setNotes('')
    }
    setConfirmDelete(false)
  }, [event, initialSlot, open])

  const endValid = !startDt || !endDt || new Date(endDt) > new Date(startDt)
  const canSave = title.trim() && startDt && (allDay || (endDt && endValid))

  async function handleSave() {
    setSaving(true)
    try {
      let startDateTime: string
      let endDateTime: string
      if (allDay) {
        // Usar T00:00 para forçar parse como horário local (não UTC)
        startDateTime = new Date(`${startDt}T00:00:00`).toISOString()
        const endDateStr = endDt || startDt
        endDateTime = new Date(`${endDateStr}T23:59:59`).toISOString()
      } else {
        startDateTime = new Date(startDt).toISOString()
        endDateTime = new Date(endDt).toISOString()
      }
      await onSave({
        title,
        type,
        startDateTime,
        endDateTime,
        isPublic,
        notes,
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setSaving(true)
    try {
      await onDelete(event.id)
    } finally {
      setSaving(false)
    }
  }

  // Read-only view for líderes
  if (!canEdit) {
    const isOwnMeeting = event?.isOwnMeeting

    return (
      <Modal open={open} onClose={onClose} title={isOwnMeeting ? 'Sua reunião' : 'Compromisso'}>
        {event ? (
          <div className="space-y-4">
            {/* Color bar */}
            <div
              className="h-2 rounded-full"
              style={{ backgroundColor: typeColors[event.type] ?? '#78716C' }}
            />

            <h3 className="font-serif text-lg text-brand-text">{event.title}</h3>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-brand-muted">
                <span>📅</span>
                <span>
                  {event.start && format(new Date(event.start), 'dd/MM/yyyy HH:mm')}
                  {event.end && ` — ${format(new Date(event.end), 'HH:mm')}`}
                </span>
              </div>
              <div className="flex items-center gap-2 text-brand-muted">
                <span>🏷</span>
                <span className="capitalize">{isOwnMeeting ? 'Reunião' : event.type}</span>
              </div>
            </div>

            {isOwnMeeting && (
              <p className="text-xs text-brand-muted bg-blue-50 rounded-lg px-3 py-2">
                Reunião agendada com o Pastor. Compareça no horário indicado.
              </p>
            )}

            {!event.isPublic && !isOwnMeeting && (
              <p className="text-xs text-brand-dim bg-brand-bg rounded-lg px-3 py-2">
                Detalhes não disponíveis
              </p>
            )}
          </div>
        ) : null}
      </Modal>
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Editar compromisso' : 'Novo compromisso'}
      footer={
        <div className="flex items-center gap-2 w-full">
          {isEditing && (
            <button
              onClick={handleDelete}
              disabled={saving}
              className="text-xs text-brand-red hover:text-red-700 font-medium mr-auto disabled:opacity-50"
            >
              {confirmDelete ? 'Tem certeza? Clique novamente para confirmar' : 'Excluir'}
            </button>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="bg-white text-brand-muted border border-brand-border rounded-lg px-4 py-2 text-sm hover:bg-brand-bg"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !canSave}
              className="bg-brand-text text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-stone-800 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar'}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-brand-text mb-1">Título *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm focus:border-brand-muted outline-none"
            placeholder="Nome do compromisso"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-brand-text mb-1">Tipo</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
          >
            {typeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={allDay}
            onChange={(e) => {
              setAllDay(e.target.checked)
              setStartDt('')
              setEndDt('')
            }}
            className="w-4 h-4 rounded border-brand-border accent-brand-text"
          />
          <span className="text-sm text-brand-text">Dia inteiro</span>
        </label>

        {allDay ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-brand-text mb-1">Data início *</label>
              <input
                type="date"
                value={startDt}
                onChange={(e) => { setStartDt(e.target.value); if (!endDt) setEndDt(e.target.value) }}
                className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-text mb-1">Data fim</label>
              <input
                type="date"
                value={endDt}
                onChange={(e) => setEndDt(e.target.value)}
                className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
              />
              <p className="text-[10px] text-brand-dim mt-0.5">Se vazio, igual à data de início</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-brand-text mb-1">Início *</label>
              <input
                type="datetime-local"
                value={startDt}
                onChange={(e) => setStartDt(e.target.value)}
                className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-text mb-1">Fim *</label>
              <input
                type="datetime-local"
                value={endDt}
                onChange={(e) => setEndDt(e.target.value)}
                className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
              />
              {!endValid && (
                <p className="text-[10px] text-brand-red mt-0.5">Fim deve ser depois do início</p>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="modal-isPublic"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="rounded border-brand-border"
          />
          <label htmlFor="modal-isPublic" className="text-xs text-brand-text">
            Visível para líderes com título
          </label>
        </div>

        <div>
          <label className="block text-xs font-medium text-brand-text mb-1">Observações internas</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none resize-none"
            placeholder="Visível apenas para pastor e secretaria"
          />
        </div>
      </div>
    </Modal>
  )
}
