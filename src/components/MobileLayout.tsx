'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { SidebarProvider } from '@/components/SidebarContext'
import { NotificationBell } from '@/components/NotificationBell'

type MobileLayoutProps = {
  sidebar: React.ReactNode
  children: React.ReactNode
  userMenu: React.ReactNode
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return isMobile
}

export function MobileLayout({ sidebar, children, userMenu }: MobileLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [hydrated, setHydrated] = useState(false)
  const pathname = usePathname()
  const isMobile = useIsMobile()

  useEffect(() => {
    setSidebarOpen(window.innerWidth >= 768)
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [pathname, isMobile])

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev)
  }, [])

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false)
  }, [])

  const ctx = useMemo(() => ({ toggle: toggleSidebar, isOpen: sidebarOpen }), [toggleSidebar, sidebarOpen])

  return (
    <SidebarProvider value={ctx}>
      <div className="min-h-screen bg-brand-bg">
        {/* Mobile overlay */}
        {sidebarOpen && isMobile && (
          <div
            className="fixed inset-0 bg-black/40 z-40 animate-fadeIn"
            onClick={closeSidebar}
          />
        )}

        {/* Sidebar wrapper */}
        <div
          className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {sidebar}
        </div>

        {/* NotificationBell + UserMenu — desktop only (mobile version is inside sidebar) */}
        <div className="hidden md:flex items-center gap-1 fixed top-3 right-6 z-[60]">
          <NotificationBell />
          {userMenu}
        </div>

        {/* NotificationBell — mobile only (top-right) */}
        <div className="md:hidden fixed top-3 right-3 z-[60]">
          <NotificationBell />
        </div>

        {/* Main content */}
        <main
          className={`min-h-screen transition-[margin] duration-200 ease-in-out ${
            sidebarOpen && !isMobile ? 'md:ml-[232px]' : 'ml-0'
          }`}
          style={!hydrated ? { marginLeft: 0 } : undefined}
        >
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}
