import { getCurrentUser } from '@/lib/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { Sidebar } from '@/components/Sidebar/Sidebar'
import { UserMenu } from '@/components/UserMenu'
import { ToastProvider } from '@/components/ui/Toast'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export default async function FrontendLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const payload = await getPayload({ config })
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? ''
  const isOnRequestsPage = pathname === '/requests'

  const pendingRequestsResult = await payload.find({
    collection: 'meeting-requests',
    where: { status: { equals: 'pendente' } },
    limit: 500,
    depth: 0,
    user,
  })

  // Se o usuário está na página de solicitações, marcar todas como vistas
  if (isOnRequestsPage) {
    const unseen = pendingRequestsResult.docs.filter((r) => {
      const seenBy = (r.seenBy as any[]) ?? []
      return !seenBy.some((u: any) => (typeof u === 'object' ? u.id : u) == user.id)
    })
    if (unseen.length > 0) {
      await Promise.all(
        unseen.map((r) => {
          const currentSeenBy = ((r.seenBy as any[]) ?? []).map((u: any) =>
            typeof u === 'object' ? u.id : u,
          )
          return payload.update({
            collection: 'meeting-requests',
            id: r.id,
            data: { seenBy: [...currentSeenBy, user.id] } as any,
            overrideAccess: true,
          })
        }),
      )
    }
  }

  const unseenRequestsCount = isOnRequestsPage
    ? 0
    : pendingRequestsResult.docs.filter((r) => {
        const seenBy = (r.seenBy as any[]) ?? []
        return !seenBy.some((u: any) => (typeof u === 'object' ? u.id : u) == user.id)
      }).length

  const pendingReservations = await payload.count({
    collection: 'reservations',
    where: { status: { equals: 'pendente' } },
  })

  const userData = {
    name: user.name as string,
    role: user.role as string,
    email: user.email || '',
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-brand-bg">
        <Sidebar
          user={userData}
          pendingRequestsCount={unseenRequestsCount}
          pendingReservationsCount={pendingReservations.totalDocs}
        />
        <div className="fixed top-3 right-6 z-[60]">
          <UserMenu user={userData} />
        </div>
        <main className="ml-[232px] min-h-screen">
          {children}
        </main>
      </div>
    </ToastProvider>
  )
}
