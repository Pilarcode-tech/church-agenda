'use client'

import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useSidebar } from '@/components/SidebarContext'

type TopbarProps = {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function Topbar({ title, subtitle, actions }: TopbarProps) {
  const sidebar = useSidebar()

  return (
    <header className="bg-brand-white border-b border-brand-border sticky top-0 z-30 px-4 md:px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {sidebar && (
          <button
            onClick={sidebar.toggle}
            className="text-brand-muted hover:text-brand-text -ml-1"
            title={sidebar.isOpen ? 'Recolher menu' : 'Expandir menu'}
          >
            {sidebar.isOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
          </button>
        )}
        <div>
          <h1 className="font-serif text-xl text-brand-text">{title}</h1>
          {subtitle && <p className="text-xs text-brand-muted mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}
