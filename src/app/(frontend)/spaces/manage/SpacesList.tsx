'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Chip } from '@/components/ui/Chip'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { Building2, Plus, Pencil, X } from 'lucide-react'
import { useToast } from '@/hooks/useToast'

type Space = {
  id: string
  name: string
  type: string
  capacity?: number
  description?: string
  requiresApproval: boolean
  active: boolean
  resources?: { resource: string; id?: string }[]
}

type Props = {
  spaces: Space[]
  userRole: string
}

type FilterTab = 'active' | 'inactive' | 'all'

const typeLabels: Record<string, string> = {
  templo: 'Templo Principal',
  sala: 'Sala de Reunião',
  salao: 'Salão de Eventos',
  estudio: 'Estúdio',
}

const emptyForm = {
  name: '',
  type: 'sala',
  capacity: '',
  description: '',
  requiresApproval: false,
  resources: [] as string[],
}

export function SpacesList({ spaces, userRole }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [filter, setFilter] = useState<FilterTab>('active')
  const [saving, setSaving] = useState(false)

  // Create modal
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [newResource, setNewResource] = useState('')

  // Edit modal
  const [editing, setEditing] = useState<Space | null>(null)
  const [editForm, setEditForm] = useState({ ...emptyForm })
  const [editNewResource, setEditNewResource] = useState('')

  const activeCount = spaces.filter((s) => s.active).length
  const inactiveCount = spaces.filter((s) => !s.active).length

  const filtered =
    filter === 'all'
      ? spaces
      : filter === 'active'
        ? spaces.filter((s) => s.active)
        : spaces.filter((s) => !s.active)

  const tabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: 'active', label: 'Ativos', count: activeCount },
    { key: 'inactive', label: 'Inativos', count: inactiveCount },
    { key: 'all', label: 'Todos' },
  ]

  function openEdit(space: Space) {
    setEditing(space)
    setEditForm({
      name: space.name,
      type: space.type,
      capacity: space.capacity ? String(space.capacity) : '',
      description: space.description ?? '',
      requiresApproval: space.requiresApproval,
      resources: (space.resources ?? []).map((r) => r.resource),
    })
    setEditNewResource('')
  }

  function addResource() {
    if (!newResource.trim()) return
    setForm({ ...form, resources: [...form.resources, newResource.trim()] })
    setNewResource('')
  }

  function removeResource(index: number) {
    setForm({ ...form, resources: form.resources.filter((_, i) => i !== index) })
  }

  function addEditResource() {
    if (!editNewResource.trim()) return
    setEditForm({ ...editForm, resources: [...editForm.resources, editNewResource.trim()] })
    setEditNewResource('')
  }

  function removeEditResource(index: number) {
    setEditForm({ ...editForm, resources: editForm.resources.filter((_, i) => i !== index) })
  }

  async function handleCreate() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: form.name,
          type: form.type,
          capacity: form.capacity ? Number(form.capacity) : undefined,
          description: form.description || undefined,
          requiresApproval: form.requiresApproval,
          resources: form.resources.map((r) => ({ resource: r })),
          active: true,
        }),
      })
      if (res.ok) {
        toast('Espaço criado com sucesso.', 'success')
        setShowNew(false)
        setForm({ ...emptyForm })
        setNewResource('')
        router.refresh()
      } else {
        toast('Erro ao criar espaço.', 'error')
      }
    } catch {
      toast('Erro ao criar espaço.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdate() {
    if (!editing || !editForm.name.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/spaces/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: editForm.name,
          type: editForm.type,
          capacity: editForm.capacity ? Number(editForm.capacity) : null,
          description: editForm.description || undefined,
          requiresApproval: editForm.requiresApproval,
          resources: editForm.resources.map((r) => ({ resource: r })),
        }),
      })
      if (res.ok) {
        toast('Espaço atualizado.', 'success')
        setEditing(null)
        router.refresh()
      } else {
        toast('Erro ao atualizar espaço.', 'error')
      }
    } catch {
      toast('Erro ao atualizar espaço.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(space: Space) {
    try {
      const res = await fetch(`/api/spaces/${space.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ active: !space.active }),
      })
      if (res.ok) {
        toast(space.active ? 'Espaço desativado.' : 'Espaço ativado.', 'success')
        router.refresh()
      } else {
        toast('Erro ao atualizar status.', 'error')
      }
    } catch {
      toast('Erro ao atualizar status.', 'error')
    }
  }

  return (
    <>
      {/* Tabs + new button */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
        <div className="flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors whitespace-nowrap ${
                filter === tab.key
                  ? 'bg-brand-text text-white font-medium'
                  : 'text-brand-muted hover:bg-brand-bg'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    filter === tab.key ? 'bg-white/20 text-white' : 'bg-brand-accentL text-brand-accent'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="bg-brand-text text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-stone-800 flex items-center gap-1.5 self-start md:self-auto"
        >
          <Plus size={14} /> Novo espaço
        </button>
      </div>

      {/* Table */}
      <div className="bg-brand-white border border-brand-border rounded-xl overflow-hidden">
        {/* Desktop header */}
        <div
          className="hidden md:grid text-[11px] text-brand-dim font-medium uppercase tracking-wider px-5 py-3 border-b border-brand-borderL"
          style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr 1fr 100px' }}
        >
          <span>Nome</span>
          <span>Tipo</span>
          <span>Capacidade</span>
          <span>Aprovação</span>
          <span>Status</span>
          <span>Ação</span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={<Building2 size={36} strokeWidth={1.5} />} message="Nenhum espaço encontrado" />
        ) : (
          filtered.map((space) => (
            <div key={space.id}>
              {/* Desktop row */}
              <div
                className="hidden md:grid items-center px-5 py-3 border-b border-brand-borderL last:border-0 hover:bg-brand-bg/50 transition-colors"
                style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr 1fr 100px' }}
              >
                <div>
                  <p className="text-sm text-brand-text font-medium">{space.name}</p>
                  {space.description && (
                    <p className="text-[11px] text-brand-dim truncate">{space.description}</p>
                  )}
                </div>
                <p className="text-sm text-brand-muted">{typeLabels[space.type] ?? space.type}</p>
                <p className="text-sm text-brand-muted">{space.capacity ? `${space.capacity} pessoas` : '—'}</p>
                <div>
                  {space.requiresApproval ? (
                    <Chip status="pendente" label="Requer aprovação" />
                  ) : (
                    <Chip status="aprovado" label="Automática" />
                  )}
                </div>
                <div>
                  <Chip status={space.active ? 'aprovado' : 'cancelado'} label={space.active ? 'Ativo' : 'Inativo'} />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(space)}
                    className="text-xs text-brand-accent hover:underline font-medium"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => toggleActive(space)}
                    className={`text-xs hover:underline ${space.active ? 'text-brand-red' : 'text-brand-green'}`}
                  >
                    {space.active ? 'Desativar' : 'Ativar'}
                  </button>
                </div>
              </div>

              {/* Mobile card */}
              <div className="md:hidden px-4 py-3 border-b border-brand-borderL last:border-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-brand-text">{space.name}</p>
                    {space.description && (
                      <p className="text-[11px] text-brand-dim truncate">{space.description}</p>
                    )}
                    <p className="text-[12px] text-brand-muted">{typeLabels[space.type] ?? space.type}</p>
                  </div>
                  <Chip status={space.active ? 'aprovado' : 'cancelado'} label={space.active ? 'Ativo' : 'Inativo'} />
                </div>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {space.capacity && <span className="text-[12px] text-brand-muted">{space.capacity} pessoas</span>}
                  {space.requiresApproval ? (
                    <Chip status="pendente" label="Requer aprovação" />
                  ) : (
                    <Chip status="aprovado" label="Automática" />
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => openEdit(space)}
                    className="text-xs text-brand-accent hover:underline font-medium"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => toggleActive(space)}
                    className={`text-xs hover:underline ${space.active ? 'text-brand-red' : 'text-brand-green'}`}
                  >
                    {space.active ? 'Desativar' : 'Ativar'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      <Modal
        open={showNew}
        onClose={() => {
          setShowNew(false)
          setForm({ ...emptyForm })
          setNewResource('')
        }}
        title="Novo espaço"
        wide
        footer={
          <>
            <button
              onClick={() => {
                setShowNew(false)
                setForm({ ...emptyForm })
                setNewResource('')
              }}
              className="bg-white text-brand-muted border border-brand-border rounded-lg px-4 py-2 text-sm hover:bg-brand-bg"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={saving || !form.name.trim()}
              className="bg-brand-text text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-stone-800 disabled:opacity-50"
            >
              {saving ? 'Criando...' : 'Criar espaço'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-brand-text mb-1">Nome do espaço *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
              placeholder="Ex: Sala de Reunião 1"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-brand-text mb-1">Tipo *</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
              >
                <option value="templo">Templo Principal</option>
                <option value="sala">Sala de Reunião</option>
                <option value="salao">Salão de Eventos</option>
                <option value="estudio">Estúdio</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-text mb-1">Capacidade</label>
              <input
                type="number"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
                placeholder="Ex: 50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-brand-text mb-1">Descrição</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none resize-none"
              placeholder="Opcional..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="requiresApproval"
              checked={form.requiresApproval}
              onChange={(e) => setForm({ ...form, requiresApproval: e.target.checked })}
              className="rounded border-brand-border"
            />
            <label htmlFor="requiresApproval" className="text-sm text-brand-text">
              Requer aprovação da secretaria
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium text-brand-text mb-1">Recursos disponíveis</label>
            <div className="flex gap-2 mb-2">
              <input
                value={newResource}
                onChange={(e) => setNewResource(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addResource())}
                className="flex-1 bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
                placeholder="Ex: Projetor, Ar-condicionado..."
              />
              <button
                type="button"
                onClick={addResource}
                className="bg-brand-bg text-brand-text border border-brand-border rounded-lg px-3 py-2 text-sm hover:bg-brand-borderL"
              >
                Adicionar
              </button>
            </div>
            {form.resources.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {form.resources.map((r, i) => (
                  <span
                    key={i}
                    className="bg-brand-bg text-brand-muted text-xs px-2.5 py-1 rounded-full flex items-center gap-1"
                  >
                    {r}
                    <button type="button" onClick={() => removeResource(i)} className="text-brand-dim hover:text-brand-red">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Editar espaço"
        wide
        footer={
          <>
            <button
              onClick={() => setEditing(null)}
              className="bg-white text-brand-muted border border-brand-border rounded-lg px-4 py-2 text-sm hover:bg-brand-bg"
            >
              Cancelar
            </button>
            <button
              onClick={handleUpdate}
              disabled={saving || !editForm.name.trim()}
              className="bg-brand-text text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-stone-800 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-brand-text mb-1">Nome do espaço *</label>
            <input
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-brand-text mb-1">Tipo *</label>
              <select
                value={editForm.type}
                onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
              >
                <option value="templo">Templo Principal</option>
                <option value="sala">Sala de Reunião</option>
                <option value="salao">Salão de Eventos</option>
                <option value="estudio">Estúdio</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-text mb-1">Capacidade</label>
              <input
                type="number"
                value={editForm.capacity}
                onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })}
                className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
                placeholder="Ex: 50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-brand-text mb-1">Descrição</label>
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              rows={2}
              className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none resize-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="editRequiresApproval"
              checked={editForm.requiresApproval}
              onChange={(e) => setEditForm({ ...editForm, requiresApproval: e.target.checked })}
              className="rounded border-brand-border"
            />
            <label htmlFor="editRequiresApproval" className="text-sm text-brand-text">
              Requer aprovação da secretaria
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium text-brand-text mb-1">Recursos disponíveis</label>
            <div className="flex gap-2 mb-2">
              <input
                value={editNewResource}
                onChange={(e) => setEditNewResource(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEditResource())}
                className="flex-1 bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
                placeholder="Ex: Projetor, Ar-condicionado..."
              />
              <button
                type="button"
                onClick={addEditResource}
                className="bg-brand-bg text-brand-text border border-brand-border rounded-lg px-3 py-2 text-sm hover:bg-brand-borderL"
              >
                Adicionar
              </button>
            </div>
            {editForm.resources.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {editForm.resources.map((r, i) => (
                  <span
                    key={i}
                    className="bg-brand-bg text-brand-muted text-xs px-2.5 py-1 rounded-full flex items-center gap-1"
                  >
                    {r}
                    <button type="button" onClick={() => removeEditResource(i)} className="text-brand-dim hover:text-brand-red">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  )
}
