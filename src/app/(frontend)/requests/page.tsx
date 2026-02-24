import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/lib/auth'
import { Topbar } from '@/components/Topbar'
import { RequestsList } from './RequestsList'

export const dynamic = 'force-dynamic'

export default async function RequestsPage() {
  const payload = await getPayload({ config })
  const user = await getCurrentUser()
  const role = (user?.role as string) ?? 'lider'

  const [allRequests, pendingCount] = await Promise.all([
    payload.find({
      collection: 'meeting-requests',
      sort: '-createdAt',
      depth: 1,
      limit: 100,
      user,
    }),
    payload.count({
      collection: 'meeting-requests',
      where: { status: { equals: 'pendente' } },
      user,
    }),
  ])

  return (
    <>
      <Topbar
        title="Solicitações de Reunião"
        subtitle="Gerencie solicitações de reunião com o pastor"
      />
      <div className="p-6">
        <RequestsList
          requests={JSON.parse(JSON.stringify(allRequests.docs))}
          pendingCount={pendingCount.totalDocs}
          userRole={role}
          userId={user?.id as number}
        />
      </div>
    </>
  )
}
