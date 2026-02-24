'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Chip } from '@/components/ui/Chip'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { Users, Plus } from 'lucide-react'
import { useToast } from '@/hooks/useToast'

type User = {
  id: string
  name: string
  email: string
  role: string
  ministerio?: string
  phone?: string
  active: boolean
}

type Props = {
  users: User[]
  userRole: string
}

type FilterTab = 'active' | 'inactive' | 'all'

const roleLabels: Record<string, string> = {
  pastor: 'Pastor',
  secretaria: 'Secretaria',
  lider: 'Líder',
}

const roleChipStatus: Record<string, string> = {
  pastor: 'reagendado',
  secretaria: 'aprovado',
  lider: 'pendente',
}

const emptyForm = {
  name: '',
  email: '',
  password: '',
  role: 'lider',
  ministerio: '',
  phone: '',
}

export function UsersList({ users, userRole }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [filter, setFilter] = useState<FilterTab>('active')
  const [saving, setSaving] = useState(false)

  // Create modal
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })

  // Edit modal
  const [editing, setEditing] = useState<User | null>(null)
  const [editForm, setEditForm] = useState({ ...emptyForm })

  const activeCount = users.filter((u) => u.active).length
  const inactiveCount = users.filter((u) => !u.active).length

  const filtered =
    filter === 'all'
      ? users
      : filter === 'active'
        ? users.filter((u) => u.active)
        : users.filter((u) => !u.active)

  const tabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: 'active', label: 'Ativos', count: activeCount },
    { key: 'inactive', label: 'Inativos', count: inactiveCount },
    { key: 'all', label: 'Todos' },
  ]

  function openEdit(user: User) {
    setEditing(user)
    setEditForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      ministerio: user.ministerio ?? '',
      phone: user.phone ?? '',
    })
  }

  async function handleCreate() {
    if (!form.name.trim() || !form.email.trim() || !form.password) return
    setSaving(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          ministerio: form.ministerio || undefined,
          phone: form.phone || undefined,
          active: true,
        }),
      })
      if (res.ok) {
        toast('Usuário criado com sucesso.', 'success')
        setShowNew(false)
        setForm({ ...emptyForm })
        router.refresh()
      } else {
        const data = await res.json().catch(() => null)
        const msg = data?.errors?.[0]?.message || 'Erro ao criar usuário.'
        toast(msg, 'error')
      }
    } catch {
      toast('Erro ao criar usuário.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdate() {
    if (!editing || !editForm.name.trim() || !editForm.email.trim()) return
    setSaving(true)
    try {
      const body: Record<string, any> = {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        ministerio: editForm.ministerio || undefined,
        phone: editForm.phone || undefined,
      }
      if (editForm.password) {
        body.password = editForm.password
      }

      const res = await fetch(`/api/users/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      if (res.ok) {
        toast('Usuário atualizado.', 'success')
        setEditing(null)
        router.refresh()
      } else {
        const data = await res.json().catch(() => null)
        const msg = data?.errors?.[0]?.message || 'Erro ao atualizar usuário.'
        toast(msg, 'error')
      }
    } catch {
      toast('Erro ao atualizar usuário.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(user: User) {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ active: !user.active }),
      })
      if (res.ok) {
        toast(user.active ? 'Usuário desativado.' : 'Usuário ativado.', 'success')
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
          className="bg-brand-text text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-stone-800 flex items-center gap-1.5"
        >
          <Plus size={14} /> Novo usuário
        </button>
      </div>

      {/* Table */}
      <div className="bg-brand-white border border-brand-border rounded-xl overflow-hidden">
        <div
          className="grid text-[11px] text-brand-dim font-medium uppercase tracking-wider px-5 py-3 border-b border-brand-borderL"
          style={{ gridTemplateColumns: '2fr 2fr 1fr 1.5fr 1fr 100px' }}
        >
          <span>Nome</span>
          <span>E-mail</span>
          <span>Perfil</span>
          <span>Ministério</span>
          <span>Status</span>
          <span>Ação</span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={<Users size={36} strokeWidth={1.5} />} message="Nenhum usuário encontrado" />
        ) : (
          filtered.map((u) => (
            <div
              key={u.id}
              className="grid items-center px-5 py-3 border-b border-brand-borderL last:border-0 hover:bg-brand-bg/50 transition-colors"
              style={{ gridTemplateColumns: '2fr 2fr 1fr 1.5fr 1fr 100px' }}
            >
              <div className="flex items-center gap-2.5">
                <Avatar name={u.name ?? '?'} size="sm" />
                <p className="text-sm text-brand-text truncate">{u.name}</p>
              </div>
              <p className="text-sm text-brand-muted truncate">{u.email}</p>
              <div>
                <Chip status={roleChipStatus[u.role] as any} label={roleLabels[u.role] ?? u.role} />
              </div>
              <p className="text-sm text-brand-muted truncate">{u.ministerio || '—'}</p>
              <div>
                <Chip status={u.active ? 'aprovado' : 'cancelado'} label={u.active ? 'Ativo' : 'Inativo'} />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEdit(u)}
                  className="text-xs text-brand-accent hover:underline font-medium"
                >
                  Editar
                </button>
                <button
                  onClick={() => toggleActive(u)}
                  className={`text-xs hover:underline ${u.active ? 'text-brand-red' : 'text-brand-green'}`}
                >
                  {u.active ? 'Desativar' : 'Ativar'}
                </button>
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
        }}
        title="Novo usuário"
        wide
        footer={
          <>
            <button
              onClick={() => {
                setShowNew(false)
                setForm({ ...emptyForm })
              }}
              className="bg-white text-brand-muted border border-brand-border rounded-lg px-4 py-2 text-sm hover:bg-brand-bg"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={saving || !form.name.trim() || !form.email.trim() || !form.password}
              className="bg-brand-text text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-stone-800 disabled:opacity-50"
            >
              {saving ? 'Criando...' : 'Criar usuário'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-brand-text mb-1">Nome completo *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
              placeholder="Ex: Maria Silva"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-brand-text mb-1">E-mail *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-text mb-1">Senha *</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-brand-text mb-1">Perfil de acesso *</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
              >
                <option value="lider">Líder</option>
                <option value="secretaria">Secretaria</option>
                <option value="pastor">Pastor</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-text mb-1">Ministério / Área</label>
              <input
                value={form.ministerio}
                onChange={(e) => setForm({ ...form, ministerio: e.target.value })}
                className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
                placeholder="Ex: Louvor, Jovens..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-brand-text mb-1">Telefone (WhatsApp)</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
              placeholder="(11) 99999-9999"
            />
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Editar usuário"
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
              disabled={saving || !editForm.name.trim() || !editForm.email.trim()}
              className="bg-brand-text text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-stone-800 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-brand-text mb-1">Nome completo *</label>
            <input
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-brand-text mb-1">E-mail *</label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-text mb-1">Nova senha</label>
              <input
                type="password"
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
                placeholder="Deixe vazio para manter"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-brand-text mb-1">Perfil de acesso *</label>
              <select
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
              >
                <option value="lider">Líder</option>
                <option value="secretaria">Secretaria</option>
                <option value="pastor">Pastor</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-text mb-1">Ministério / Área</label>
              <input
                value={editForm.ministerio}
                onChange={(e) => setEditForm({ ...editForm, ministerio: e.target.value })}
                className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-brand-text mb-1">Telefone (WhatsApp)</label>
            <input
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
            />
          </div>
        </div>
      </Modal>
    </>
  )
}
