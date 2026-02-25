'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { usePathname } from 'next/navigation'

type Notification = {
  id: number
  type: string
  message: string
  sourceCollection: string
  sourceId: number
  read: boolean
  createdAt: string
}

const POLL_INTERVAL = 30_000

export function useNotifications() {
  const [count, setCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const pathname = usePathname()
  const prevPathname = useRef(pathname)

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/count', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setCount(data.count)
      }
    } catch {
      // silently ignore
    }
  }, [])

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications?limit=20', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.docs)
      }
    } catch {
      // silently ignore
    } finally {
      setLoading(false)
    }
  }, [])

  const markAsRead = useCallback(async (ids: number[]) => {
    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids }),
      })
      setNotifications((prev) =>
        prev.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n)),
      )
      setCount((prev) => Math.max(0, prev - ids.length))
    } catch {
      // silently ignore
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ all: true }),
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setCount(0)
    } catch {
      // silently ignore
    }
  }, [])

  const markTypeAsRead = useCallback(async (types: string[]) => {
    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ types }),
      })
      setNotifications((prev) =>
        prev.map((n) => (types.includes(n.type) ? { ...n, read: true } : n)),
      )
      fetchCount()
    } catch {
      // silently ignore
    }
  }, [fetchCount])

  // Polling
  useEffect(() => {
    fetchCount()
    const interval = setInterval(fetchCount, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchCount])

  // Auto-mark on page navigation
  useEffect(() => {
    if (pathname === prevPathname.current) return
    prevPathname.current = pathname

    if (pathname === '/requests') {
      markTypeAsRead([
        'REQUEST_CREATED',
        'REQUEST_APPROVED',
        'REQUEST_REJECTED',
        'REQUEST_RESCHEDULED',
      ])
    } else if (pathname === '/reservations') {
      markTypeAsRead([
        'RESERVATION_CREATED',
        'RESERVATION_APPROVED',
        'RESERVATION_REJECTED',
      ])
    }
  }, [pathname, markTypeAsRead])

  return {
    count,
    notifications,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    markTypeAsRead,
  }
}
