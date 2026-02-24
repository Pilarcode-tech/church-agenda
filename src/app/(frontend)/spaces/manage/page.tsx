import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/lib/auth'
import { Topbar } from '@/components/Topbar'
import { SpacesList } from './SpacesList'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ManageSpacesPage() {
  const payload = await getPayload({ config })
  const user = await getCurrentUser()
  const role = (user?.role as string) ?? 'lider'

  if (role !== 'pastor' && role !== 'secretaria') {
    redirect('/spaces')
  }

  const allSpaces = await payload.find({
    collection: 'spaces',
    sort: 'name',
    limit: 100,
  })

  return (
    <>
      <Topbar
        title="Gerenciar Espaços"
        subtitle="Crie, edite e gerencie os espaços da igreja"
      />
      <div className="p-6">
        <SpacesList
          spaces={JSON.parse(JSON.stringify(allSpaces.docs))}
          userRole={role}
        />
      </div>
    </>
  )
}
