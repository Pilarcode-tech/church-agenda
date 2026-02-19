import { getCurrentUser } from '@/lib/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { Sidebar } from '@/components/Sidebar/Sidebar'
import { UserMenu } from '@/components/UserMenu'
import { ToastProvider } from '@/components/ui/Toast'
import { redirect } from 'next/navigation'

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

  const pendingRequests = await payload.count({
    collection: 'meeting-requests',
    where: { status: { equals: 'pendente' } },
  })

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
          pendingRequestsCount={pendingRequests.totalDocs}
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
