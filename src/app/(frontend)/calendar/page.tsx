import { getPayload } from 'payload'
import config from '@payload-config'
import { Topbar } from '@/components/Topbar'
import { CalendarView } from '@/components/Calendar/CalendarView'

export const dynamic = 'force-dynamic'

export default async function CalendarPage() {
  const payload = await getPayload({ config })

  const spaces = await payload.find({
    collection: 'spaces',
    where: { active: { equals: true } },
    limit: 50,
  })

  const spaceOptions = spaces.docs.map((s) => ({
    id: String(s.id),
    name: s.name,
  }))

  return (
    <>
      <Topbar
        title="Calendário Geral"
        subtitle="Visualize todos os eventos e reservas aprovadas"
      />
      <div className="p-6">
        <div className="bg-brand-white border border-brand-border rounded-xl p-5">
          <CalendarView spaces={spaceOptions} />
        </div>
      </div>
    </>
  )
}
