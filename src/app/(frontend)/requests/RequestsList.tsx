'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Chip } from '@/components/ui/Chip'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { format } from 'date-fns'
import { Mail } from 'lucide-react'
import { useToast } from '@/hooks/useToast'

type Request = {
  id: string
  reason: string
  suggestedDate: string
  estimatedDuration: number
  status: string
  confirmedDateTime?: string
  responseNote?: string
  requestedBy: {
    id: string
    name: string
    ministerio?: string
    email: string
  }
}

type Props = {
  requests: Request[]
  pendingCount: number
  userRole: string
}

type FilterTab = 'pendente' | 'aprovado' | 'recusado' | 'all'

export function RequestsList({ requests, pendingCount, userRole }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [filter, setFilter] = useState<FilterTab>('pendente')
  const [selected, setSelected] = useState<Request | null>(null)
  const [action, setAction] = useState('aprovado')
  const [confirmedDateTime, setConfirmedDateTime] = useState('')
  const [responseNote, setResponseNote] = useState('')
  const [saving, setSaving] = useState(false)

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

  return (
    <>
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4">
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

      {/* Table */}
      <div className="bg-brand-white border border-brand-border rounded-xl overflow-hidden">
        {/* Header */}
        <div className="grid text-[11px] text-brand-dim font-medium uppercase tracking-wider px-5 py-3 border-b border-brand-borderL" style={{ gridTemplateColumns: '2fr 1.5fr 1.5fr 1fr 1fr 80px' }}>
          <span>Solicitante</span>
          <span>Motivo</span>
          <span>Sugestão de horário</span>
          <span>Duração</span>
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
              style={{ gridTemplateColumns: '2fr 1.5fr 1.5fr 1fr 1fr 80px' }}
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
              <p className="text-sm text-brand-muted">{req.estimatedDuration} min</p>
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
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div>
                  <p className="text-[11px] text-brand-dim">Motivo</p>
                  <p className="text-sm text-brand-text">{selected.reason}</p>
                </div>
                <div>
                  <p className="text-[11px] text-brand-dim">Sugestão</p>
                  <p className="text-sm text-brand-text">{format(new Date(selected.suggestedDate), "dd/MM/yyyy 'às' HH:mm")}</p>
                </div>
                <div>
                  <p className="text-[11px] text-brand-dim">Duração</p>
                  <p className="text-sm text-brand-text">{selected.estimatedDuration} min</p>
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
    </>
  )
}
