import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/lib/auth'
import { Topbar } from '@/components/Topbar'
import { ReservationsList } from './ReservationsList'

export const dynamic = 'force-dynamic'

export default async function ReservationsPage() {
  const payload = await getPayload({ config })
  const user = await getCurrentUser()
  const role = (user?.role as string) ?? 'lider'

  const [allReservations, pendingCount, spaces] = await Promise.all([
    payload.find({
      collection: 'reservations',
      sort: '-createdAt',
      depth: 1,
      limit: 100,
    }),
    payload.count({
      collection: 'reservations',
      where: { status: { equals: 'pendente' } },
    }),
    payload.find({
      collection: 'spaces',
      where: { active: { equals: true } },
      limit: 50,
    }),
  ])

  return (
    <>
      <Topbar
        title="Reservas"
        subtitle="Gerencie reservas de espaços da igreja"
      />
      <div className="p-6">
        <ReservationsList
          reservations={JSON.parse(JSON.stringify(allReservations.docs))}
          pendingCount={pendingCount.totalDocs}
          userRole={role}
          userId={String(user?.id ?? '')}
          spaces={JSON.parse(JSON.stringify(spaces.docs))}
        />
      </div>
    </>
  )
}
