import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(req: NextRequest) {
  const payload = await getPayload({ config })
  const { searchParams } = new URL(req.url)

  const start = searchParams.get('start')
  const end = searchParams.get('end')

  // Buscar reservas aprovadas
  const reservations = await payload.find({
    collection: 'reservations',
    where: {
      and: [
        { status: { equals: 'aprovado' } },
        { startDateTime: { greater_than_equal: start } },
        { endDateTime: { less_than_equal: end } },
      ],
    },
    depth: 2,
  })

  // Buscar agenda do pastor (eventos públicos)
  const pastorEvents = await payload.find({
    collection: 'pastor-schedule',
    where: {
      and: [
        { isPublic: { equals: true } },
        { startDateTime: { greater_than_equal: start } },
        { endDateTime: { less_than_equal: end } },
      ],
    },
  })

  // Formatar para FullCalendar
  const events = [
    ...reservations.docs.map((r) => ({
      id: `reservation-${r.id}`,
      title: r.title,
      start: r.startDateTime,
      end: r.endDateTime,
      backgroundColor: '#2563EB',
      borderColor: '#1D4ED8',
      extendedProps: {
        type: 'reservation',
        space: (r.space as any)?.name,
        eventType: r.eventType,
      },
    })),
    ...pastorEvents.docs.map((e) => ({
      id: `pastor-${e.id}`,
      title: e.title,
      start: e.startDateTime,
      end: e.endDateTime,
      backgroundColor: '#16A34A',
      borderColor: '#15803D',
      extendedProps: {
        type: 'pastor',
      },
    })),
  ]

  return NextResponse.json(events)
}
