'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Check } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useNotifications } from '@/hooks/useNotifications'

const typeConfig: Record<string, { dot: string; route: string }> = {
  REQUEST_CREATED: { dot: 'bg-brand-amber', route: '/requests' },
  REQUEST_APPROVED: { dot: 'bg-brand-green', route: '/requests' },
  REQUEST_REJECTED: { dot: 'bg-brand-red', route: '/requests' },
  REQUEST_RESCHEDULED: { dot: 'bg-brand-amber', route: '/requests' },
  RESERVATION_CREATED: { dot: 'bg-brand-amber', route: '/reservations' },
  RESERVATION_APPROVED: { dot: 'bg-brand-green', route: '/reservations' },
  RESERVATION_REJECTED: { dot: 'bg-brand-red', route: '/reservations' },
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const {
    count,
    notifications,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications()

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

  function handleToggle() {
    const next = !open
    setOpen(next)
    if (next) {
      fetchNotifications()
    }
  }

  function handleClickNotification(notification: (typeof notifications)[0]) {
    if (!notification.read) {
      markAsRead([notification.id])
    }
    const cfg = typeConfig[notification.type]
    if (cfg) {
      router.push(cfg.route)
    }
    setOpen(false)
  }

  function handleMarkAllAsRead() {
    markAllAsRead()
  }

  return (
    <div ref={menuRef} className="relative">
      {/* Bell trigger */}
      <button
        onClick={handleToggle}
        className="relative flex items-center justify-center w-10 h-10 rounded-xl hover:bg-brand-bg transition-colors"
        aria-label="Notificações"
      >
        <Bell size={20} className="text-brand-muted" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-brand-red text-white text-[10px] font-semibold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-brand-white border border-brand-border rounded-xl shadow-lg overflow-hidden animate-fadeIn z-[70]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-brand-borderL">
            <span className="text-sm font-medium text-brand-text">Notificações</span>
            {count > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1 text-[11px] text-brand-accent hover:underline"
              >
                <Check size={12} />
                Marcar todas como lidas
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-brand-muted">
                Carregando...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-brand-muted">
                Nenhuma notificação
              </div>
            ) : (
              notifications.map((n) => {
                const cfg = typeConfig[n.type] || { dot: 'bg-brand-muted', route: '/' }
                return (
                  <button
                    key={n.id}
                    onClick={() => handleClickNotification(n)}
                    className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-brand-bg transition-colors border-b border-brand-borderL last:border-0 ${
                      !n.read ? 'bg-brand-accentL/30' : ''
                    }`}
                  >
                    <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm leading-snug ${!n.read ? 'text-brand-text font-medium' : 'text-brand-muted'}`}>
                        {n.message}
                      </p>
                      <p className="text-[11px] text-brand-dim mt-0.5">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                    {!n.read && (
                      <span className="mt-1.5 w-2 h-2 rounded-full bg-brand-accent shrink-0" />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
