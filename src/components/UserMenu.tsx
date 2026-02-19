'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/ui/Avatar'
import { User, LogOut, ChevronDown } from 'lucide-react'

type UserMenuProps = {
  user: {
    name: string
    email: string
    role: string
  }
}

const roleLabel: Record<string, string> = {
  pastor: 'Pastor',
  secretaria: 'Secretaria',
  lider: 'Líder',
}

export function UserMenu({ user }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  async function handleLogout() {
    await fetch('/api/users/logout', {
      method: 'POST',
      credentials: 'include',
    })
    router.push('/login')
  }

  return (
    <div ref={menuRef} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-start gap-2.5 px-3 py-2 rounded-xl hover:bg-brand-bg transition-colors"
      >
        <Avatar name={user.name} size="lg" />
        <div className="hidden sm:block text-left pt-0.5">
          <span className="text-sm font-medium text-brand-text block leading-tight">{user.name}</span>
          <span className="text-[11px] text-brand-dim leading-tight">{roleLabel[user.role] ?? user.role}</span>
        </div>
        <ChevronDown size={14} className={`text-brand-muted mt-1.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-1 w-60 bg-brand-white border border-brand-border rounded-xl shadow-lg overflow-hidden animate-fadeIn">
          {/* User info */}
          <div className="px-4 py-3 border-b border-brand-borderL">
            <div className="flex items-center gap-3">
              <Avatar name={user.name} size="lg" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-brand-text truncate">{user.name}</p>
                <p className="text-[11px] text-brand-dim truncate">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <a
              href="/admin/account"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-brand-text hover:bg-brand-bg transition-colors"
            >
              <User size={16} className="text-brand-muted" />
              Perfil
            </a>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
