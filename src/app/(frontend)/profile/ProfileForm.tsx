'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/ui/Avatar'
import { useToast } from '@/hooks/useToast'

type Props = {
  user: {
    id: string
    name: string
    email: string
    role: string
    ministerio: string
    phone: string
  }
}

const roleLabels: Record<string, string> = {
  pastor: 'Pastor',
  secretaria: 'Secretaria',
  lider: 'Líder',
}

export function ProfileForm({ user }: Props) {
  const router = useRouter()
  const { toast } = useToast()

  const [form, setForm] = useState({
    name: user.name,
    ministerio: user.ministerio,
    phone: user.phone,
  })

  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  })

  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  async function handleSaveProfile() {
    if (!form.name.trim()) return
    setSavingProfile(true)
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: form.name,
          ministerio: form.ministerio || undefined,
          phone: form.phone || undefined,
        }),
      })
      if (res.ok) {
        toast('Perfil atualizado com sucesso.', 'success')
        router.refresh()
      } else {
        toast('Erro ao atualizar perfil.', 'error')
      }
    } catch {
      toast('Erro ao atualizar perfil.', 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleChangePassword() {
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      toast('A senha deve ter no mínimo 6 caracteres.', 'error')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast('As senhas não coincidem.', 'error')
      return
    }
    setSavingPassword(true)
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          password: passwordForm.newPassword,
        }),
      })
      if (res.ok) {
        toast('Senha alterada com sucesso.', 'success')
        setPasswordForm({ newPassword: '', confirmPassword: '' })
      } else {
        toast('Erro ao alterar senha.', 'error')
      }
    } catch {
      toast('Erro ao alterar senha.', 'error')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* User info header */}
      <div className="bg-brand-white border border-brand-border rounded-xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <Avatar name={user.name} size="lg" />
          <div>
            <h2 className="text-lg font-medium text-brand-text">{user.name}</h2>
            <p className="text-sm text-brand-muted">{user.email}</p>
            <p className="text-xs text-brand-dim mt-0.5">{roleLabels[user.role] ?? user.role}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-brand-text mb-1">Nome completo *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-brand-text mb-1">E-mail</label>
            <input
              value={user.email}
              disabled
              className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-muted outline-none cursor-not-allowed"
            />
            <p className="text-[11px] text-brand-dim mt-1">O e-mail não pode ser alterado.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-brand-text mb-1">Ministério / Área</label>
              <input
                value={form.ministerio}
                onChange={(e) => setForm({ ...form, ministerio: e.target.value })}
                className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
                placeholder="Ex: Louvor, Jovens..."
              />
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

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile || !form.name.trim()}
              className="bg-brand-text text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-stone-800 disabled:opacity-50"
            >
              {savingProfile ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </div>
      </div>

      {/* Password change */}
      <div className="bg-brand-white border border-brand-border rounded-xl p-6">
        <h3 className="font-serif text-base text-brand-text mb-4">Alterar senha</h3>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-brand-text mb-1">Nova senha *</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-text mb-1">Confirmar nova senha *</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm outline-none"
                placeholder="Repita a nova senha"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleChangePassword}
              disabled={savingPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
              className="bg-brand-text text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-stone-800 disabled:opacity-50"
            >
              {savingPassword ? 'Alterando...' : 'Alterar senha'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
