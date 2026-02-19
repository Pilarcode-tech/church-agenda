import { getCurrentUser } from '@/lib/auth'
import { Topbar } from '@/components/Topbar'
import PastorCalendar from '@/components/Pastor/PastorCalendar'

export const dynamic = 'force-dynamic'

export default async function PastorPage() {
  const user = await getCurrentUser()
  const role = (user?.role as string) ?? 'lider'
  const name = (user?.name as string) ?? ''

  return (
    <>
      <Topbar
        title="Agenda do Pastor"
        subtitle="Gerencie compromissos e horários"
      />
      <div className="p-6">
        <PastorCalendar
          userRole={role as 'pastor' | 'secretaria' | 'lider'}
          userName={name}
        />
      </div>
    </>
  )
}
