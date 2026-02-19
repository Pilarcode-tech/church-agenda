'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      })

      if (!res.ok) {
        setError('E-mail ou senha inválidos.')
        setLoading(false)
        return
      }

      router.push('/')
      router.refresh()
    } catch {
      setError('Erro ao conectar. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl text-brand-text">Verbo Arujá</h1>
          <p className="text-xs text-brand-muted mt-1">Sistema de Agenda — Arujá • SP</p>
        </div>

        {/* Card de login */}
        <form
          onSubmit={handleSubmit}
          className="bg-brand-white border border-brand-border rounded-xl p-6 space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-brand-text mb-1.5">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm focus:border-brand-muted outline-none placeholder:text-brand-dim"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-brand-text mb-1.5">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-brand-white border border-brand-border rounded-lg px-3 py-2 text-sm focus:border-brand-muted outline-none placeholder:text-brand-dim"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-xs text-brand-red bg-brand-redL rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-text text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-stone-800 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
