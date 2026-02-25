import { getCurrentUser } from '@/lib/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect } from 'next/navigation'
import { Topbar } from '@/components/Topbar'
import { BlockForm } from './BlockForm'

export const dynamic = 'force-dynamic'

export default async function BlockPage() {
  const user = await getCurrentUser()
  const role = (user?.role as string) ?? 'lider'

  // Redireciona líderes
  if (role === 'lider') {
    redirect('/')
  }

  const payload = await getPayload({ config })

  const blocks = await payload.find({
    collection: 'pastor-schedule',
    where: {
      and: [
        { type: { equals: 'bloqueio' } },
        { startDateTime: { greater_than_equal: new Date().toISOString() } },
      ],
    },
    sort: 'startDateTime',
    limit: 50,
  })

  return (
    <>
      <Topbar
        title="Bloquear Agenda"
        subtitle="Bloqueie períodos na agenda do pastor"
      />
      <div className="p-4 md:p-6">
        <BlockForm blocks={JSON.parse(JSON.stringify(blocks.docs))} />
      </div>
    </>
  )
}
