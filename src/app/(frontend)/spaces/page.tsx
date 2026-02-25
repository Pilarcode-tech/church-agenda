import { getPayload } from 'payload'
import config from '@payload-config'
import { Topbar } from '@/components/Topbar'
import { Chip } from '@/components/ui/Chip'
import { startOfDay, endOfDay, format, addHours, isBefore, isAfter } from 'date-fns'

export const dynamic = 'force-dynamic'

const typeIcons: Record<string, string> = {
  templo: '⛪',
  sala: '🚪',
  salao: '🏛',
  estudio: '🎙',
}

export default async function SpacesPage() {
  const payload = await getPayload({ config })
  const now = new Date()
  const todayStart = startOfDay(now).toISOString()
  const todayEnd = endOfDay(now).toISOString()

  const [spaces, todayReservations] = await Promise.all([
    payload.find({
      collection: 'spaces',
      where: { active: { equals: true } },
      limit: 50,
    }),
    payload.find({
      collection: 'reservations',
      where: {
        and: [
          { status: { equals: 'aprovado' } },
          { startDateTime: { greater_than_equal: todayStart } },
          { startDateTime: { less_than_equal: todayEnd } },
        ],
      },
      depth: 1,
      sort: 'startDateTime',
      limit: 200,
    }),
  ])

  // Build availability blocks for each space (08:00 - 22:00)
  function getAvailabilityBlocks(spaceId: string | number) {
    const spaceReservations = todayReservations.docs.filter((r) => {
      const spaceRef = r.space as any
      return (spaceRef?.id ?? spaceRef) === spaceId
    })

    const blocks: { start: Date; end: Date; free: boolean; title?: string }[] = []
    const dayStart = addHours(startOfDay(now), 8) // 08:00
    const dayEnd = addHours(startOfDay(now), 22)  // 22:00

    let cursor = dayStart

    for (const res of spaceReservations) {
      const resStart = new Date(res.startDateTime as string)
      const resEnd = new Date(res.endDateTime as string)

      if (isAfter(resStart, cursor)) {
        blocks.push({ start: cursor, end: resStart, free: true })
      }
      blocks.push({ start: resStart, end: resEnd, free: false, title: res.title as string })
      cursor = resEnd
    }

    if (isBefore(cursor, dayEnd)) {
      blocks.push({ start: cursor, end: dayEnd, free: true })
    }

    return blocks
  }

  // Check if space has any reservation right now
  function isCurrentlyFree(spaceId: string | number) {
    return !todayReservations.docs.some((r) => {
      const spaceRef = r.space as any
      const sId = spaceRef?.id ?? spaceRef
      if (sId !== spaceId) return false
      const start = new Date(r.startDateTime as string)
      const end = new Date(r.endDateTime as string)
      return isBefore(start, now) && isAfter(end, now)
    })
  }

  return (
    <>
      <Topbar
        title="Espaços e Salas"
        subtitle="Visualize espaços disponíveis e suas reservas"
      />
      <div className="p-4 md:p-6 space-y-6">
        {/* Space cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {spaces.docs.map((space) => {
            const free = isCurrentlyFree(space.id)
            const resources = (space.resources as any[]) ?? []

            return (
              <div
                key={space.id}
                className="bg-brand-white border border-brand-border rounded-xl p-5 hover:border-brand-muted transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl">{typeIcons[space.type as string] ?? '🏠'}</span>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-brand-text">{space.name}</h3>
                    {space.capacity && (
                      <p className="text-[11px] text-brand-dim">{space.capacity} pessoas</p>
                    )}
                  </div>
                </div>

                {/* Availability indicator */}
                <div className="flex items-center gap-1.5 mb-3">
                  <div className={`w-2 h-2 rounded-full ${free ? 'bg-brand-green' : 'bg-brand-amber'}`} />
                  <span className={`text-[11px] ${free ? 'text-brand-green' : 'text-brand-amber'}`}>
                    {free ? 'Disponível agora' : 'Em uso'}
                  </span>
                </div>

                {/* Approval chip */}
                <div className="mb-3">
                  {space.requiresApproval ? (
                    <Chip status="pendente" label="Requer aprovação" />
                  ) : (
                    <Chip status="aprovado" label="Aprovação automática" />
                  )}
                </div>

                {/* Resources */}
                {resources.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {resources.map((r: any, i: number) => (
                      <span key={i} className="bg-brand-bg text-brand-muted text-[10px] px-2 py-0.5 rounded-full">
                        {r.resource}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Availability today */}
        <div>
          <h2 className="font-serif text-base text-brand-text mb-4">Disponibilidade hoje</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {spaces.docs.map((space) => {
              const blocks = getAvailabilityBlocks(space.id)

              return (
                <div key={space.id} className="bg-brand-white border border-brand-border rounded-xl p-4">
                  <h3 className="text-sm font-medium text-brand-text mb-3">{space.name}</h3>
                  <div className="space-y-1.5">
                    {blocks.map((block, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                          block.free
                            ? 'bg-brand-greenL text-brand-green'
                            : 'bg-brand-accentL text-brand-accent'
                        }`}
                      >
                        <span className="tabular-nums font-medium">
                          {format(block.start, 'HH:mm')} — {format(block.end, 'HH:mm')}
                        </span>
                        <span className="truncate">{block.free ? 'Livre' : block.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
