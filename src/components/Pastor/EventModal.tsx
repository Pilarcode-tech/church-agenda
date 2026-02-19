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
      setIsPublic(event.isPublic ?? false)
      setNotes(event.notes ?? '')
    } else if (initialSlot) {
      setTitle('')
      setType('reuniao')
      setStartDt(toLocalDatetime(initialSlot.start))
      setEndDt(toLocalDatetime(initialSlot.end))
      setIsPublic(false)
      setNotes('')
    } else {
      setTitle('')
      setType('reuniao')
      setStartDt('')
      setEndDt('')
      setIsPublic(false)
      setNotes('')
    }
    setConfirmDelete(false)
  }, [event, initialSlot, open])

  const endValid = !startDt || !endDt || new Date(endDt) > new Date(startDt)
  const canSave = title.trim() && startDt && endDt && endValid

  async function handleSave() {
    setSaving(true)
    try {
      await onSave({
        title,
        type,
        startDateTime: new Date(startDt).toISOString(),
        endDateTime: new Date(endDt).toISOString(),
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
    return (
      <Modal open={open} onClose={onClose} title="Compromisso">
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
                <span className="capitalize">{event.type}</span>
              </div>
            </div>

            {!event.isPublic && (
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
