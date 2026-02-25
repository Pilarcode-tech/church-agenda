import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/lib/auth'
import { Topbar } from '@/components/Topbar'
import { UsersList } from './UsersList'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const payload = await getPayload({ config })
  const user = await getCurrentUser()
  const role = (user?.role as string) ?? 'lider'

  if (role !== 'pastor' && role !== 'secretaria') {
    redirect('/')
  }

  const allUsers = await payload.find({
    collection: 'users',
    sort: 'name',
    limit: 200,
  })

  return (
    <>
      <Topbar
        title="Usuários"
        subtitle="Gerencie os usuários do sistema"
      />
      <div className="p-4 md:p-6">
        <UsersList
          users={JSON.parse(JSON.stringify(allUsers.docs))}
          userRole={role}
        />
      </div>
    </>
  )
}
