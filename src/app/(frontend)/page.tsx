import { getPayload } from 'payload'
import config from '@payload-config'
import { Topbar } from '@/components/Topbar'
import { Chip } from '@/components/ui/Chip'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { Mail, CalendarCheck, Building2, Clock } from 'lucide-react'
import Link from 'next/link'
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const payload = await getPayload({ config })
  const now = new Date()
  const todayStart = startOfDay(now).toISOString()
  const todayEnd = endOfDay(now).toISOString()
  const weekStart = startOfWeek(now, { locale: ptBR }).toISOString()
  const weekEnd = endOfWeek(now, { locale: ptBR }).toISOString()
  const monthStart = startOfMonth(now).toISOString()
  const monthEnd = endOfMonth(now).toISOString()
  const next7days = addDays(now, 7).toISOString()

  // Stat queries
  const [pendingRequests, weekEvents, activeReservations, blockedDays] = await Promise.all([
    payload.count({
      collection: 'meeting-requests',
      where: { status: { equals: 'pendente' } },
    }),
    payload.count({
      collection: 'pastor-schedule',
      where: {
        and: [
          { startDateTime: { greater_than_equal: weekStart } },
          { startDateTime: { less_than_equal: weekEnd } },
        ],
      },
    }),
    payload.count({
      collection: 'reservations',
      where: {
        and: [
          { status: { equals: 'aprovado' } },
          { startDateTime: { greater_than_equal: todayStart } },
          { startDateTime: { less_than_equal: next7days } },
        ],
      },
    }),
    payload.count({
      collection: 'pastor-schedule',
      where: {
        and: [
          { type: { equals: 'bloqueio' } },
          { startDateTime: { greater_than_equal: monthStart } },
          { startDateTime: { less_than_equal: monthEnd } },
        ],
      },
    }),
  ])

  // Data queries
  const [recentRequests, upcomingReservations, todayEvents] = await Promise.all([
    payload.find({
      collection: 'meeting-requests',
      where: { status: { equals: 'pendente' } },
      limit: 3,
      sort: '-createdAt',
      depth: 1,
    }),
    payload.find({
      collection: 'reservations',
      where: {
        and: [
          { status: { equals: 'aprovado' } },
          { startDateTime: { greater_than_equal: todayStart } },
        ],
      },
      limit: 3,
      sort: 'startDateTime',
      depth: 1,
    }),
    payload.find({
      collection: 'pastor-schedule',
      where: {
        and: [
          { startDateTime: { greater_than_equal: todayStart } },
          { startDateTime: { less_than_equal: todayEnd } },
        ],
      },
      sort: 'startDateTime',
    }),
  ])

  const stats = [
    { label: 'Solicitações pendentes', value: pendingRequests.totalDocs, color: 'text-brand-amber' },
    { label: 'Compromissos esta semana', value: weekEvents.totalDocs, color: 'text-brand-accent' },
    { label: 'Reservas ativas', value: activeReservations.totalDocs, color: 'text-brand-green' },
    { label: 'Dias bloqueados no mês', value: blockedDays.totalDocs, color: 'text-brand-red' },
  ]

  const typeBarColors: Record<string, string> = {
    reuniao: 'bg-brand-accent',
    aconselhamento: 'bg-violet-500',
    pregacao: 'bg-brand-green',
    viagem: 'bg-teal-500',
    pessoal: 'bg-brand-amber',
    bloqueio: 'bg-brand-red',
  }

  return (
    <>
      <Topbar
        title="Dashboard"
        subtitle={format(now, "EEEE, d 'de' MMMM", { locale: ptBR })}
      />

      <div className="p-6 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-brand-white border border-brand-border rounded-xl p-4">
              <p className="text-xs text-brand-muted">{stat.label}</p>
              <p className={`text-2xl font-semibold mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Grid 2 colunas */}
        <div className="grid grid-cols-2 gap-4">
          {/* Solicitações pendentes */}
          <div className="bg-brand-white border border-brand-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-base text-brand-text">Solicitações pendentes</h2>
              <Link href="/requests" className="text-xs text-brand-accent hover:underline">
                ver todas →
              </Link>
            </div>
            {recentRequests.docs.length === 0 ? (
              <EmptyState icon={<Mail size={36} strokeWidth={1.5} />} message="Nenhuma solicitação pendente" />
            ) : (
              <div className="space-y-3">
                {recentRequests.docs.map((req) => {
                  const user = req.requestedBy as any
                  return (
                    <div key={req.id} className="flex items-center gap-3">
                      <Avatar name={user?.name ?? 'Anônimo'} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-brand-text truncate">{user?.name ?? '—'}</p>
                        <p className="text-[11px] text-brand-dim truncate">{user?.ministerio ?? req.reason}</p>
                      </div>
                      <Chip status={req.status as any} />
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Próximas reservas */}
          <div className="bg-brand-white border border-brand-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-base text-brand-text">Próximas reservas</h2>
              <Link href="/reservations" className="text-xs text-brand-accent hover:underline">
                ver todas →
              </Link>
            </div>
            {upcomingReservations.docs.length === 0 ? (
              <EmptyState icon={<CalendarCheck size={36} strokeWidth={1.5} />} message="Nenhuma reserva ativa" />
            ) : (
              <div className="space-y-3">
                {upcomingReservations.docs.map((res) => {
                  const space = res.space as any
                  return (
                    <div key={res.id} className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-brand-accentL text-brand-accent rounded-lg flex items-center justify-center">
                        <Building2 size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-brand-text truncate">{space?.name ?? '—'}</p>
                        <p className="text-[11px] text-brand-dim">
                          {format(new Date(res.startDateTime as string), "dd/MM 'às' HH:mm")}
                        </p>
                      </div>
                      <Chip status={res.status as any} />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Agenda de hoje */}
        <div className="bg-brand-white border border-brand-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-base text-brand-text">Agenda de hoje</h2>
            <Link href="/pastor" className="text-xs text-brand-accent hover:underline">
              ver agenda →
            </Link>
          </div>
          {todayEvents.docs.length === 0 ? (
            <EmptyState icon={<Clock size={36} strokeWidth={1.5} />} message="Nenhum compromisso hoje" />
          ) : (
            <div className="space-y-2">
              {todayEvents.docs.map((ev) => (
                <div key={ev.id} className="flex items-center gap-3 py-2">
                  <span className="text-xs text-brand-muted w-16 shrink-0 text-right tabular-nums">
                    {format(new Date(ev.startDateTime as string), 'HH:mm')}
                  </span>
                  <div className={`w-1 h-8 rounded-full ${typeBarColors[ev.type as string] ?? 'bg-brand-dim'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-brand-text truncate">{ev.title}</p>
                    <p className="text-[11px] text-brand-dim capitalize">{ev.type}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
