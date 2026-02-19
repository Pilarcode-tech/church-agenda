'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Chip } from '@/components/ui/Chip'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { format } from 'date-fns'
import { CalendarCheck, Plus } from 'lucide-react'
import { useToast } from '@/hooks/useToast'

type Reservation = {
  id: string
  title: string
  eventType: string
  startDateTime: string
  endDateTime: string
  attendeesCount?: number
  status: string
  responseNote?: string
  space: { id: string; name: string; requiresApproval?: boolean }
  requestedBy: { id: string; name: string; ministerio?: string }
}

type Space = {
  id: string
  name: string
  requiresApproval: boolean
}

type Props = {
  reservations: Reservation[]
  pendingCount: number
  userRole: string
  userId: string
  spaces: Space[]
}

type FilterTab = 'pendente' | 'aprovado' | 'all'

export function ReservationsList({ reservations, pendingCount, userRole, userId, spaces }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [filter, setFilter] = useState<FilterTab>('pendente')
  const canApprove = userRole === 'pastor' || userRole === 'secretaria'

  // New reservation modal
  const [showNew, setShowNew] = useState(false)
  const [newForm, setNewForm] = useState({
    title: '',
    space: '',
    eventType: 'reuniao',
    startDateTime: '',
    endDateTime: '',
    attendeesCount: '',
  })
  const [conflictMsg, setConflictMsg] = useState('')
  const [saving, setSaving] = useState(false)

  // Approval modal
  const [selected, setSelected] = useState<Reservation | null>(null)
  const [approvalAction, setApprovalAction] = useState('aprovado')
  const [approvalNote, setApprovalNote] = useState('')

  const filtered = filter === 'all' ? reservations : reservations.filter((r) => r.status === filter)

  const tabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: 'pendente', label: 'Pendentes', count: pendingCount },
    { key: 'aprovado', label: 'Aprovadas' },
    { key: 'all', label: 'Todas' },
  ]

  const selectedSpace = spaces.find((s) => s.id === newForm.space)

  // Check conflict when dates change
  async function checkConflict() {
    if (!newForm.space || !newForm.startDateTime || !newForm.endDateTime) {
      setConflictMsg('')
      return
    }
    try {
      const res = await fetch(
        `/api/reservations/check-conflict?space=${newForm.space}&start=${newForm.startDateTime}&end=${newForm.endDateTime}`,
        { credentials: 'include' }
      )
      const data = await res.json()
      if (data.hasConflict) {
        setConflictMsg('Conflito de horário! Já existe uma reserva aprovada neste período.')
      } else {
        setConflictMsg('')
      }
    } catch {
      setConflictMsg('')
    }
  }

  async function handleCreateReservation() {
    setSaving(true)
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: newForm.title,
          space: newForm.space,
          eventType: newForm.eventType,
          startDateTime: newForm.startDateTime,
          endDateTime: newForm.endDateTime,
          attendeesCount: newForm.attendeesCount ? Number(newForm.attendeesCount) : undefined,
          requestedBy: userId,
        }),
      })
      if (res.ok) {
        toast('Reserva criada com sucesso.', 'success')
        setShowNew(false)
        setNewForm({ title: '', space: '', eventType: 'reuniao', startDateTime: '', endDateTime: '', attendeesCount: '' })
        setConflictMsg('')
        router.refresh()
      } else {
        toast('Erro ao criar reserva.', 'error')
      }
    } catch {
      toast('Erro ao criar reserva.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleApprove() {
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch(`/api/reservations/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status: approvalAction,
          responseNote: approvalNote,
        }),
      })
      if (res.ok) {
        toast('Reserva atualizada.', 'success')
        setSelected(null)
        router.refresh()
      } else {
        toast('Erro ao atualizar reserva.', 'error')
      }
    } catch {
      toast('Erro ao atualizar reserva.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Tabs + new button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                filter === tab.key
                  ? 'bg-brand-text text-white font-medium'
                  : 'text-brand-muted hover:bg-brand-bg'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                  filter === tab.key ? 'bg-white/20 text-white' : 'bg-brand-amberL text-brand-amber'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="bg-brand-text text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-stone-800 flex items-center gap-1.5"
        >
          <Plus size={14} /> Nova reserva
        </button>
      </div>

      {/* Table */}
      <div className="bg-brand-white border border-brand-border rounded-xl overflow-hidden">
        <div className="grid text-[11px] text-brand-dim font-medium uppercase tracking-wider px-5 py-3 border-b border-brand-borderL" style={{ gridTemplateColumns: '2fr 1.5fr 1.5fr 1.5fr 1fr 80px' }}>
          <span>Evento</span>
          <span>Espaço</span>
          <span>Data e hora</span>
          <span>Solicitante</span>
          <span>Status</span>
          <span>Ação</span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={<CalendarCheck size={36} strokeWidth={1.5} />} message="Nenhuma reserva encontrada" />
        ) : (
          filtered.map((res) => (
            <div
              key={res.id}
              className="grid items-center px-5 py-3 border-b border-brand-borderL last:border-0 hover:bg-brand-bg/50 transition-colors"
              style={{ gridTemplateColumns: '2fr 1.5fr 1.5fr 1.5fr 1fr 80px' }}
            >
              <div>
                <p className="text-sm text-brand-text truncate">{res.title}</p>
                <p className="text-[11px] text-brand-dim capitalize">{res.eventType?.replace('_', ' ')}</p>
              </div>
              <p className="text-sm text-brand-muted truncate">{res.space?.name ?? '—'}</p>
              <p className="text-sm text-brand-muted">
                {format(new Date(res.startDateTime), "dd/MM 'às' HH:mm")}
              </p>
              <div className="flex items-center gap-2">
                <Avatar name={res.requestedBy?.name ?? '?'} size="sm" />
                <span className="text-sm text-brand-text truncate">{res.requestedBy?.name ?? '—'}</span>
              </div>
              <Chip status={res.status as any} />
              <div>
                {res.status === 'pendente' && canApprove ? (
                  <button
                    onClick={() => { setSelected(res); setApprovalAction('aprovado'); setApprovalNote('') }}
                    className="text-xs text-brand-green font-medium hover:underline"
                  >
                    Aprovar
                  </button>
                ) : (
                  <button
                    onClick={() => setSelected(res)}
                    className="text-xs text-brand-muted hover:underline"
                  >
                    Ver
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* New reservation modal */}
      <Modal
        open={showNew}
        onClose={() => { setShowNew(false); setConflictMsg('') }}
        title="Nova reserva"
        wide
        footer={
          <>
            <button onClick={() => { setShowNew(false); setConflictMsg('') }} className="bg-white text-brand-muted border border-brand-border rounded-lg px-4 py-2 text-sm hover:bg-brand-bg">
              Cancelar
            </button>
            <button
              onClick={handleCreateReservation}
              disabled={saving || !!conflictMsg || !newForm.title || !newForm.space}
              className="bg-brand-text text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-stone-800 disabled:opacity-50"
            >
              {saving ? 'Criando...' : 'Confirmar reserva'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-brand-text mb-1">Espaço</label>
            <select
              value={newForm.space}
              onChange={(e) => { setNewForm({ ...newForm, space: e.target.value }); setConflictMsg('') }}
              className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
            >
              <option value="">Selecione um espaço</option>
              {spaces.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {selectedSpace && (
              <p className="text-[11px] mt-1">
                {selectedSpace.requiresApproval ? (
                  <span className="text-brand-amber">Requer aprovação da secretaria</span>
                ) : (
                  <span className="text-brand-green">Aprovação automática</span>
                )}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-brand-text mb-1">Nome do evento</label>
            <input
              value={newForm.title}
              onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
              className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
              placeholder="Ex: Ensaio do louvor"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-brand-text mb-1">Tipo de evento</label>
            <select
              value={newForm.eventType}
              onChange={(e) => setNewForm({ ...newForm, eventType: e.target.value })}
              className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
            >
              <option value="reuniao">Reunião</option>
              <option value="evento">Evento</option>
              <option value="ensaio">Ensaio</option>
              <option value="gravacao">Gravação</option>
              <option value="culto_especial">Culto especial</option>
              <option value="outro">Outro</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-brand-text mb-1">Início</label>
              <input
                type="datetime-local"
                value={newForm.startDateTime}
                onChange={(e) => setNewForm({ ...newForm, startDateTime: e.target.value })}
                onBlur={checkConflict}
                className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-text mb-1">Fim</label>
              <input
                type="datetime-local"
                value={newForm.endDateTime}
                onChange={(e) => setNewForm({ ...newForm, endDateTime: e.target.value })}
                onBlur={checkConflict}
                className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>

          {conflictMsg && (
            <p className="text-xs text-brand-red bg-brand-redL rounded-lg px-3 py-2">{conflictMsg}</p>
          )}

          <div>
            <label className="block text-xs font-medium text-brand-text mb-1">Número estimado de pessoas</label>
            <input
              type="number"
              value={newForm.attendeesCount}
              onChange={(e) => setNewForm({ ...newForm, attendeesCount: e.target.value })}
              className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
              placeholder="Opcional"
            />
          </div>
        </div>
      </Modal>

      {/* Approval / Details modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.status === 'pendente' && canApprove ? 'Aprovar reserva' : 'Detalhes da reserva'}
        wide
        footer={
          selected?.status === 'pendente' && canApprove ? (
            <>
              <button onClick={() => setSelected(null)} className="bg-white text-brand-muted border border-brand-border rounded-lg px-4 py-2 text-sm hover:bg-brand-bg">
                Cancelar
              </button>
              <button onClick={handleApprove} disabled={saving} className="bg-brand-text text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-stone-800 disabled:opacity-50">
                {saving ? 'Salvando...' : 'Confirmar'}
              </button>
            </>
          ) : undefined
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="bg-brand-bg rounded-lg p-4 space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] text-brand-dim">Evento</p>
                  <p className="text-sm text-brand-text font-medium">{selected.title}</p>
                </div>
                <div>
                  <p className="text-[11px] text-brand-dim">Espaço</p>
                  <p className="text-sm text-brand-text">{selected.space?.name}</p>
                </div>
                <div>
                  <p className="text-[11px] text-brand-dim">Horário</p>
                  <p className="text-sm text-brand-text">
                    {format(new Date(selected.startDateTime), "dd/MM/yyyy HH:mm")} — {format(new Date(selected.endDateTime), "HH:mm")}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-brand-dim">Solicitante</p>
                  <p className="text-sm text-brand-text">{selected.requestedBy?.name}</p>
                </div>
              </div>
            </div>

            {selected.status === 'pendente' && canApprove ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-brand-text mb-1">Decisão</label>
                  <select
                    value={approvalAction}
                    onChange={(e) => setApprovalAction(e.target.value)}
                    className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
                  >
                    <option value="aprovado">Aprovar</option>
                    <option value="recusado">Recusar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-text mb-1">Observação</label>
                  <textarea
                    value={approvalNote}
                    onChange={(e) => setApprovalNote(e.target.value)}
                    rows={2}
                    className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none resize-none"
                    placeholder="Opcional..."
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-brand-dim">Status:</span>
                  <Chip status={selected.status as any} />
                </div>
                {selected.responseNote && (
                  <div>
                    <p className="text-xs text-brand-dim">Observação</p>
                    <p className="text-sm text-brand-text">{selected.responseNote}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}
