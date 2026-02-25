'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Calendar, Clock, Mail, Building2, CalendarCheck, Ban, Settings, Users } from 'lucide-react'

type NavItem = {
  label: string
  href: string
  icon: React.ReactNode
  badge?: number
}

type NavGroup = {
  title: string
  items: NavItem[]
  roleRequired?: string[]
}

type SidebarProps = {
  user: {
    name: string
    role: string
    email: string
  } | null
  pendingRequestsCount?: number
  pendingReservationsCount?: number
  userMenu?: React.ReactNode
}

export function Sidebar({ user, pendingRequestsCount = 0, pendingReservationsCount = 0, userMenu }: SidebarProps) {
  const pathname = usePathname()

  const navGroups: NavGroup[] = [
    {
      title: 'Principal',
      items: [
        { label: 'Dashboard', href: '/', icon: <LayoutDashboard size={16} /> },
        { label: 'Calendário Geral', href: '/calendar', icon: <Calendar size={16} /> },
      ],
    },
    {
      title: 'Agenda',
      items: [
        { label: 'Agenda do Pastor', href: '/pastor', icon: <Clock size={16} /> },
        { label: 'Solicitações', href: '/requests', icon: <Mail size={16} />, badge: pendingRequestsCount },
      ],
    },
    {
      title: 'Espaços',
      items: [
        { label: 'Espaços e Salas', href: '/spaces', icon: <Building2 size={16} /> },
        { label: 'Reservas', href: '/reservations', icon: <CalendarCheck size={16} />, badge: pendingReservationsCount },
      ],
    },
    {
      title: 'Gestão',
      roleRequired: ['pastor', 'secretaria'],
      items: [
        { label: 'Gerenciar Espaços', href: '/spaces/manage', icon: <Settings size={16} /> },
        { label: 'Usuários', href: '/users', icon: <Users size={16} /> },
        { label: 'Bloquear Agenda', href: '/block', icon: <Ban size={16} /> },
      ],
    },
  ]

  return (
    <aside className="w-[232px] h-screen bg-brand-white border-r border-brand-border flex flex-col">
      {/* Logo */}
      <div className="px-4 pt-5 pb-4 border-b border-brand-borderL">
        <h1 className="font-serif text-xl text-brand-text">Verbo Arujá</h1>
        <p className="text-[11px] text-brand-muted mt-0.5">Sistema de Agenda</p>
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navGroups.map((group) => {
          if (group.roleRequired && user && !group.roleRequired.includes(user.role)) {
            return null
          }

          return (
            <div key={group.title}>
              <p className="text-[11px] font-medium text-brand-dim uppercase tracking-wider px-2 mb-1.5">
                {group.title}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-colors ${
                          isActive
                            ? 'bg-brand-accentL text-brand-accent font-medium'
                            : 'text-brand-muted hover:bg-brand-bg hover:text-brand-text'
                        }`}
                      >
                        <span className="w-5 flex items-center justify-center">{item.icon}</span>
                        <span className="flex-1">{item.label}</span>
                        {item.badge && item.badge > 0 ? (
                          <span className="bg-brand-amber text-white text-[10px] font-semibold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                            {item.badge}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </nav>

      {/* UserMenu inside sidebar on mobile */}
      {userMenu && (
        <div className="md:hidden border-t border-brand-borderL px-3 py-3">
          {userMenu}
        </div>
      )}
    </aside>
  )
}
