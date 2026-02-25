'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { EmptyState } from '@/components/ui/EmptyState'
import { format } from 'date-fns'
import { Ban, X } from 'lucide-react'
import { useToast } from '@/hooks/useToast'

type Block = {
  id: string
  title: string
  startDateTime: string
  endDateTime: string
  isPublic: boolean
  notes?: string
}

type Props = {
  blocks: Block[]
}

export function BlockForm({ blocks }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [form, setForm] = useState({
    reason: 'viagem',
    startDateTime: '',
    endDateTime: '',
    visibility: 'false',
    notes: '',
  })
  const [allDay, setAllDay] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      let startDateTime = form.startDateTime
      let endDateTime = form.endDateTime
      if (allDay) {
        // Usar T00:00 para forçar parse como horário local (não UTC)
        const s = new Date(`${form.startDateTime}T00:00`)
        startDateTime = s.toISOString()
        const endDateStr = form.endDateTime || form.startDateTime
        const e = new Date(`${endDateStr}T23:59:59`)
        endDateTime = e.toISOString()
      }
      const res = await fetch('/api/pastor-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: `Bloqueio — ${form.reason}`,
          type: 'bloqueio',
          startDateTime,
          endDateTime,
          isPublic: form.visibility === 'true',
          notes: form.notes,
        }),
      })
      if (res.ok) {
        toast('Bloqueio criado com sucesso.', 'success')
        setForm({ reason: 'viagem', startDateTime: '', endDateTime: '', visibility: 'false', notes: '' })
        setAllDay(false)
        router.refresh()
      } else {
        toast('Erro ao criar bloqueio.', 'error')
      }
    } catch {
      toast('Erro ao criar bloqueio.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      const res = await fetch(`/api/pastor-schedule/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        toast('Bloqueio removido.', 'success')
        router.refresh()
      } else {
        toast('Erro ao remover bloqueio.', 'error')
      }
    } catch {
      toast('Erro ao remover bloqueio.', 'error')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Formulário */}
      <div className="bg-brand-white border border-brand-border rounded-xl p-5">
        <h2 className="font-serif text-base text-brand-text mb-4">Novo bloqueio</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-brand-text mb-1">Motivo</label>
            <select
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
            >
              <option value="viagem">Viagem</option>
              <option value="pessoal">Pessoal</option>
              <option value="ferias">Férias</option>
              <option value="outro">Outro</option>
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => {
                setAllDay(e.target.checked)
                setForm({ ...form, startDateTime: '', endDateTime: '' })
              }}
              className="w-4 h-4 rounded border-brand-border accent-brand-text"
            />
            <span className="text-sm text-brand-text">Dia inteiro</span>
          </label>

          {allDay ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-brand-text mb-1">Data início</label>
                <input
                  type="date"
                  value={form.startDateTime}
                  onChange={(e) => setForm({ ...form, startDateTime: e.target.value, endDateTime: e.target.value })}
                  required
                  className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-text mb-1">Data fim</label>
                <input
                  type="date"
                  value={form.endDateTime}
                  onChange={(e) => setForm({ ...form, endDateTime: e.target.value })}
                  required
                  className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-brand-text mb-1">Data/hora início</label>
                <input
                  type="datetime-local"
                  value={form.startDateTime}
                  onChange={(e) => setForm({ ...form, startDateTime: e.target.value })}
                  required
                  className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-text mb-1">Data/hora fim</label>
                <input
                  type="datetime-local"
                  value={form.endDateTime}
                  onChange={(e) => setForm({ ...form, endDateTime: e.target.value })}
                  required
                  className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-brand-text mb-1">O que os líderes veem</label>
            <select
              value={form.visibility}
              onChange={(e) => setForm({ ...form, visibility: e.target.value })}
              className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
            >
              <option value="false">Apenas &quot;Ocupado&quot; (sem detalhes)</option>
              <option value="true">Título visível</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-brand-text mb-1">Observação interna</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none resize-none"
              placeholder="Visível apenas para pastor e secretaria"
            />
          </div>

          <button
            type="submit"
            disabled={saving || !form.startDateTime || !form.endDateTime}
            className="w-full bg-brand-red text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Bloqueando...' : 'Confirmar bloqueio'}
          </button>
        </form>
      </div>

      {/* Bloqueios ativos */}
      <div className="bg-brand-white border border-brand-border rounded-xl p-5">
        <h2 className="font-serif text-base text-brand-text mb-4">Bloqueios ativos</h2>
        {blocks.length === 0 ? (
          <EmptyState icon={<Ban size={36} strokeWidth={1.5} />} message="Nenhum bloqueio futuro" description="Bloqueios aparecerão aqui após serem criados" />
        ) : (
          <div className="space-y-3">
            {blocks.map((block) => (
              <div
                key={block.id}
                className="flex items-start gap-3 p-3 bg-brand-redL/50 border border-brand-redL rounded-lg"
              >
                <div className="w-1 h-full min-h-[40px] bg-brand-red rounded-full shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brand-text">{block.title}</p>
                  <p className="text-[11px] text-brand-muted">
                    {format(new Date(block.startDateTime), 'dd/MM/yyyy HH:mm')} — {format(new Date(block.endDateTime), 'dd/MM/yyyy HH:mm')}
                  </p>
                  <p className="text-[11px] text-brand-dim mt-0.5">
                    {block.isPublic ? 'Visível para líderes' : 'Apenas "Ocupado"'}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(block.id)}
                  disabled={deleting === block.id}
                  className="text-brand-red hover:text-red-700 text-sm shrink-0 disabled:opacity-50"
                >
                  {deleting === block.id ? '...' : <X size={14} />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
