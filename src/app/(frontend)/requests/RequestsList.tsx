'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Chip } from '@/components/ui/Chip'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { format } from 'date-fns'
import { Mail, Plus } from 'lucide-react'
import { useToast } from '@/hooks/useToast'

type Request = {
  id: string
  reason: string
  modality?: string
  suggestedDate: string
  estimatedDuration: number
  status: string
  confirmedDateTime?: string
  responseNote?: string
  seenBy?: ({ id: string } | string | number)[]
  requestedBy: {
    id: string
    name: string
    ministerio?: string
    email: string
  }
}

const modalityLabels: Record<string, string> = {
  presencial: 'Presencial',
  online: 'Online',
}

type Props = {
  requests: Request[]
  pendingCount: number
  userRole: string
  userId: number
}

type FilterTab = 'pendente' | 'aprovado' | 'recusado' | 'all'

export function RequestsList({ requests, pendingCount, userRole, userId }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [filter, setFilter] = useState<FilterTab>('pendente')
  const [selected, setSelected] = useState<Request | null>(null)
  const [action, setAction] = useState('aprovado')
  const [confirmedDateTime, setConfirmedDateTime] = useState('')
  const [responseNote, setResponseNote] = useState('')
  const [saving, setSaving] = useState(false)

  // Estado do modal de nova solicitação
  const [newModalOpen, setNewModalOpen] = useState(false)
  const [newReason, setNewReason] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newDuration, setNewDuration] = useState(30)
  const [newModality, setNewModality] = useState('presencial')
  const [creatingSaving, setCreatingSaving] = useState(false)
  const [conflictMsg, setConflictMsg] = useState('')

  const canEvaluate = userRole === 'pastor' || userRole === 'secretaria'

  const filtered = filter === 'all'
    ? requests
    : requests.filter((r) => r.status === filter)

  const tabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: 'pendente', label: 'Pendentes', count: pendingCount },
    { key: 'aprovado', label: 'Aprovadas' },
    { key: 'recusado', label: 'Recusadas' },
    { key: 'all', label: 'Todas' },
  ]

  function openModal(req: Request) {
    setSelected(req)
    setAction('aprovado')
    setConfirmedDateTime(req.suggestedDate)
    setResponseNote(req.responseNote ?? '')
  }

  async function handleSubmit() {
    if (!selected) return
    setSaving(true)
    try {
      const body: any = {
        status: action,
        responseNote,
      }
      if (action === 'aprovado' || action === 'reagendado') {
        body.confirmedDateTime = confirmedDateTime
      }

      const res = await fetch(`/api/meeting-requests/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })

      if (res.ok) {
        toast('Solicitação atualizada.', 'success')
        setSelected(null)
        router.refresh()
      } else {
        toast('Erro ao atualizar solicitação.', 'error')
      }
    } catch {
      toast('Erro ao atualizar solicitação.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function checkConflict(date?: string, duration?: number): Promise<boolean> {
    const d = date ?? newDate
    const dur = duration ?? newDuration
    if (!d) {
      setConflictMsg('')
      return false
    }
    try {
      // Buscar todos os eventos do dia para verificar conflitos
      const dayStart = new Date(d)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(d)
      dayEnd.setHours(23, 59, 59, 999)

      const res = await fetch(
        `/api/pastor-schedule?start=${dayStart.toISOString()}&end=${dayEnd.toISOString()}`,
        { credentials: 'include' },
      )
      if (!res.ok) {
        setConflictMsg('')
        return false
      }
      const events = await res.json()
      if (!Array.isArray(events)) {
        setConflictMsg('')
        return false
      }

      // Verificar se algum evento/bloqueio conflita com o horário solicitado
      const reqStart = new Date(d).getTime()
      const reqEnd = reqStart + dur * 60000

      const conflicting = events.find((evt: any) => {
        const evtStart = new Date(evt.start).getTime()
        const evtEnd = new Date(evt.end).getTime()
        return reqStart < evtEnd && reqEnd > evtStart
      })

      if (conflicting) {
        const evtTitle = conflicting.title ?? 'Ocupado'
        setConflictMsg(`Horário indisponível na agenda do pastor (${evtTitle}). Escolha outro horário.`)
        return true
      } else {
        setConflictMsg('')
        return false
      }
    } catch {
      setConflictMsg('')
      return false
    }
  }

  async function handleCreateRequest() {
    if (!newReason.trim() || !newDate) return
    setCreatingSaving(true)
    try {
      // Verificar conflito antes de enviar (garante que o check roda mesmo se o onChange não completou)
      const hasConflict = await checkConflict(newDate, newDuration)
      if (hasConflict) {
        setCreatingSaving(false)
        return
      }

      const res = await fetch('/api/meeting-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          requestedBy: userId,
          modality: newModality,
          reason: newReason,
          suggestedDate: new Date(newDate).toISOString(),
          estimatedDuration: newDuration,
          status: 'pendente',
        }),
      })
      if (res.ok) {
        toast('Solicitação enviada com sucesso!', 'success')
        setNewModalOpen(false)
        setNewReason('')
        setNewDate('')
        setNewDuration(30)
        setNewModality('presencial')
        setConflictMsg('')
        router.refresh()
      } else {
        toast('Erro ao enviar solicitação.', 'error')
      }
    } catch {
      toast('Erro ao enviar solicitação.', 'error')
    } finally {
      setCreatingSaving(false)
    }
  }

  return (
    <>
      {/* Header com botão de nova solicitação */}
      <div className="flex items-center justify-between mb-4">
        {/* Tabs */}
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
          onClick={() => setNewModalOpen(true)}
          className="px-3 py-1.5 rounded-lg bg-brand-text text-white hover:bg-stone-800 text-xs font-medium transition-colors flex items-center gap-1.5"
        >
          <Plus size={14} /> Nova solicitação
        </button>
      </div>

      {/* Table */}
      <div className="bg-brand-white border border-brand-border rounded-xl overflow-hidden">
        {/* Header */}
        <div className="grid text-[11px] text-brand-dim font-medium uppercase tracking-wider px-5 py-3 border-b border-brand-borderL" style={{ gridTemplateColumns: '2fr 2fr 1.5fr 1fr 1fr 80px' }}>
          <span>Solicitante</span>
          <span>Assunto</span>
          <span>Sugestão de horário</span>
          <span>Modalidade</span>
          <span>Status</span>
          <span>Ação</span>
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <EmptyState icon={<Mail size={36} strokeWidth={1.5} />} message="Nenhuma solicitação encontrada" />
        ) : (
          filtered.map((req) => (
            <div
              key={req.id}
              className="grid items-center px-5 py-3 border-b border-brand-borderL last:border-0 hover:bg-brand-bg/50 transition-colors"
              style={{ gridTemplateColumns: '2fr 2fr 1.5fr 1fr 1fr 80px' }}
            >
              <div className="flex items-center gap-2.5">
                <Avatar name={req.requestedBy?.name ?? '?'} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm text-brand-text truncate">{req.requestedBy?.name ?? '—'}</p>
                  <p className="text-[11px] text-brand-dim truncate">{req.requestedBy?.ministerio ?? ''}</p>
                </div>
              </div>
              <p className="text-sm text-brand-text truncate">{req.reason}</p>
              <p className="text-sm text-brand-muted">
                {format(new Date(req.suggestedDate), "dd/MM/yyyy 'às' HH:mm")}
              </p>
              <p className="text-sm text-brand-muted">{modalityLabels[req.modality ?? ''] ?? '—'}</p>
              <Chip status={req.status as any} />
              <div>
                {req.status === 'pendente' && canEvaluate ? (
                  <button
                    onClick={() => openModal(req)}
                    className="text-xs text-brand-accent hover:underline font-medium"
                  >
                    Avaliar
                  </button>
                ) : (
                  <button
                    onClick={() => openModal(req)}
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

      {/* Modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.status === 'pendente' && canEvaluate ? 'Avaliar solicitação' : 'Detalhes da solicitação'}
        wide
        footer={
          selected?.status === 'pendente' && canEvaluate ? (
            <>
              <button onClick={() => setSelected(null)} className="bg-white text-brand-muted border border-brand-border rounded-lg px-4 py-2 text-sm hover:bg-brand-bg">
                Cancelar
              </button>
              <button onClick={handleSubmit} disabled={saving} className="bg-brand-text text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-stone-800 disabled:opacity-50">
                {saving ? 'Salvando...' : 'Confirmar'}
              </button>
            </>
          ) : undefined
        }
      >
        {selected && (
          <div className="space-y-4">
            {/* Info card */}
            <div className="bg-brand-bg rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Avatar name={selected.requestedBy?.name ?? '?'} />
                <div>
                  <p className="text-sm font-medium text-brand-text">{selected.requestedBy?.name}</p>
                  <p className="text-[11px] text-brand-dim">{selected.requestedBy?.ministerio ?? ''}</p>
                </div>
              </div>
              <div className="pt-2">
                <p className="text-[11px] text-brand-dim">Assunto / Motivo</p>
                <p className="text-sm text-brand-text whitespace-pre-line">{selected.reason}</p>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div>
                  <p className="text-[11px] text-brand-dim">Sugestão</p>
                  <p className="text-sm text-brand-text">
                    {format(new Date(selected.suggestedDate), "dd/MM/yyyy 'às' HH:mm")}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-brand-dim">Duração</p>
                  <p className="text-sm text-brand-text">{selected.estimatedDuration} min</p>
                </div>
                <div>
                  <p className="text-[11px] text-brand-dim">Modalidade</p>
                  <p className="text-sm text-brand-text">{modalityLabels[selected.modality ?? ''] ?? '—'}</p>
                </div>
              </div>
            </div>

            {/* Action form (only for pending + privileged) */}
            {selected.status === 'pendente' && canEvaluate ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-brand-text mb-1">Ação</label>
                  <select
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                    className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
                  >
                    <option value="aprovado">Aprovar no horário sugerido</option>
                    <option value="reagendado">Reagendar</option>
                    <option value="recusado">Recusar</option>
                  </select>
                </div>

                {(action === 'aprovado' || action === 'reagendado') && (
                  <div>
                    <label className="block text-xs font-medium text-brand-text mb-1">
                      {action === 'reagendado' ? 'Novo horário' : 'Horário confirmado'}
                    </label>
                    <input
                      type="datetime-local"
                      value={confirmedDateTime ? confirmedDateTime.slice(0, 16) : ''}
                      onChange={(e) => setConfirmedDateTime(e.target.value)}
                      className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-brand-text mb-1">Mensagem para o líder</label>
                  <textarea
                    value={responseNote}
                    onChange={(e) => setResponseNote(e.target.value)}
                    rows={2}
                    className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none resize-none"
                    placeholder="Mensagem opcional..."
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-brand-dim">Status:</span>
                  <Chip status={selected.status as any} />
                </div>
                {selected.confirmedDateTime && (
                  <div>
                    <p className="text-xs text-brand-dim">Horário confirmado</p>
                    <p className="text-sm text-brand-text">{format(new Date(selected.confirmedDateTime), "dd/MM/yyyy 'às' HH:mm")}</p>
                  </div>
                )}
                {selected.responseNote && (
                  <div>
                    <p className="text-xs text-brand-dim">Resposta</p>
                    <p className="text-sm text-brand-text">{selected.responseNote}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal de nova solicitação */}
      <Modal
        open={newModalOpen}
        onClose={() => { setNewModalOpen(false); setConflictMsg('') }}
        title="Solicitar reunião com o Pastor"
        wide
        footer={
          <>
            <button
              onClick={() => { setNewModalOpen(false); setConflictMsg('') }}
              className="bg-white text-brand-muted border border-brand-border rounded-lg px-4 py-2 text-sm hover:bg-brand-bg"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateRequest}
              disabled={creatingSaving || !newReason.trim() || !newDate || !!conflictMsg}
              className="bg-brand-text text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-stone-800 disabled:opacity-50"
            >
              {creatingSaving ? 'Enviando...' : 'Enviar solicitação'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-brand-text mb-1">Assunto / Motivo da reunião *</label>
            <textarea
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              rows={3}
              className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none resize-none"
              placeholder="Descreva o assunto que deseja tratar na reunião com o pastor..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-brand-text mb-1">Modalidade *</label>
            <select
              value={newModality}
              onChange={(e) => setNewModality(e.target.value)}
              className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
            >
              <option value="presencial">Presencial</option>
              <option value="online">Online</option>
            </select>
            <p className="text-[11px] text-brand-dim mt-1">
              A modalidade pode ser alterada pelo pastor ao avaliar a solicitação.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-brand-text mb-1">Data e horário sugerido *</label>
              <input
                type="datetime-local"
                value={newDate}
                onChange={(e) => {
                  setNewDate(e.target.value)
                  checkConflict(e.target.value, newDuration)
                }}
                className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-text mb-1">Duração estimada</label>
              <select
                value={newDuration}
                onChange={(e) => {
                  const dur = Number(e.target.value)
                  setNewDuration(dur)
                  checkConflict(newDate, dur)
                }}
                className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
              >
                <option value={15}>15 minutos</option>
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>1 hora</option>
                <option value={90}>1h30</option>
                <option value={120}>2 horas</option>
              </select>
            </div>
          </div>

          {conflictMsg && (
            <p className="text-xs text-brand-red bg-brand-redL rounded-lg px-3 py-2">{conflictMsg}</p>
          )}

          <p className="text-[11px] text-brand-dim">
            Sua solicitação será enviada para o pastor e a secretaria avaliarem.
          </p>
        </div>
      </Modal>
    </>
  )
}
