'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'

interface BlockModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: any) => Promise<void>
}

const reasonOptions = [
  { value: 'Viagem', label: 'Viagem' },
  { value: 'Descanso/Folga', label: 'Descanso / Folga' },
  { value: 'Compromisso pessoal', label: 'Compromisso pessoal' },
  { value: 'Retiro espiritual', label: 'Retiro espiritual' },
  { value: 'Tratamento de saúde', label: 'Tratamento de saúde' },
  { value: 'Outro', label: 'Outro' },
]

const visibilityOptions = [
  { value: 'agenda-bloqueada', label: 'Agenda bloqueada', isPublic: true, titleText: 'Agenda bloqueada' },
  { value: 'indisponivel', label: 'Indisponível', isPublic: true, titleText: 'Indisponível' },
  { value: 'ocultar', label: 'Ocultar (apenas "Ocupado")', isPublic: false, titleText: 'Bloqueio' },
]

export default function BlockModal({ open, onClose, onSave }: BlockModalProps) {
  const [reason, setReason] = useState('Viagem')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('22:00')
  const [visibility, setVisibility] = useState('agenda-bloqueada')
  const [notes, setNotes] = useState('')
  const [allDay, setAllDay] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setReason('Viagem')
      setStartDate('')
      setEndDate('')
      setStartTime('08:00')
      setEndTime('22:00')
      setVisibility('agenda-bloqueada')
      setNotes('')
      setAllDay(false)
    }
  }, [open])

  useEffect(() => {
    if (allDay) {
      setStartTime('00:00')
      setEndTime('23:59')
    } else {
      setStartTime('08:00')
      setEndTime('22:00')
    }
  }, [allDay])

  const canSave = startDate && endDate

  async function handleSave() {
    const vis = visibilityOptions.find((v) => v.value === visibility)
    const effectiveEndDate = endDate || startDate

    setSaving(true)
    try {
      await onSave({
        title: `${vis?.titleText ?? 'Bloqueio'} — ${reason}`,
        startDateTime: new Date(`${startDate}T${startTime}`).toISOString(),
        endDateTime: new Date(`${effectiveEndDate}T${endTime}`).toISOString(),
        isPublic: vis?.isPublic ?? false,
        notes,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Bloquear período"
      footer={
        <>
          <button
            onClick={onClose}
            className="bg-white text-brand-muted border border-brand-border rounded-lg px-4 py-2 text-sm hover:bg-brand-bg"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !canSave}
            className="bg-brand-red text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-50"
          >
            {saving ? 'Bloqueando...' : 'Confirmar bloqueio'}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-brand-text mb-1">Motivo</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
          >
            {reasonOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-brand-text mb-1">Data início</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                if (!endDate) setEndDate(e.target.value)
              }}
              className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-brand-text mb-1">Data fim</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="block-allday"
            checked={allDay}
            onChange={(e) => setAllDay(e.target.checked)}
            className="rounded border-brand-border"
          />
          <label htmlFor="block-allday" className="text-xs text-brand-text">
            Bloquear dia todo
          </label>
        </div>

        {!allDay && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-brand-text mb-1">Hora início</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-text mb-1">Hora fim</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-brand-text mb-1">Visibilidade para líderes</label>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
          >
            {visibilityOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <p className="text-[10px] text-brand-dim mt-1">
            {visibility === 'ocultar'
              ? 'Líderes verão apenas "Ocupado" sem detalhes'
              : 'Líderes verão o texto selecionado acima'
            }
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-brand-text mb-1">Observação interna</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
            placeholder="Visível apenas para pastor e secretaria"
          />
        </div>
      </div>
    </Modal>
  )
}
