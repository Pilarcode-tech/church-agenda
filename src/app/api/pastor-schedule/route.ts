import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { headers as getHeaders } from 'next/headers'

function getColorByType(type: string): string {
  const colors: Record<string, string> = {
    reuniao:        '#2563EB',
    aconselhamento: '#7C3AED',
    pregacao:       '#16A34A',
    viagem:         '#D97706',
    pessoal:        '#78716C',
    bloqueio:       '#DC2626',
  }
  return colors[type] ?? '#78716C'
}

export async function GET(req: NextRequest) {
  const payload = await getPayload({ config })
  const hdrs = await getHeaders()
  const { user } = await payload.auth({ headers: hdrs })

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const start = searchParams.get('start')
  const end = searchParams.get('end')
  const userRole = user.role as string

  const isPrivileged = userRole === 'pastor' || userRole === 'secretaria'

  const where: any = {}
  if (start && end) {
    where.and = [
      { startDateTime: { greater_than_equal: start } },
      { startDateTime: { less_than_equal: end } },
    ]
  }

  // Líderes só veem eventos públicos
  if (!isPrivileged) {
    where.and = [...(where.and || []), { isPublic: { equals: true } }]
  }

  const events = await payload.find({
    collection: 'pastor-schedule',
    where,
    sort: 'startDateTime',
    limit: 200,
    depth: 1,
  })

  const formatted = events.docs.map((event) => ({
    id: event.id,
    title: event.isPublic || isPrivileged ? event.title : 'Ocupado',
    type: event.type,
    start: event.startDateTime,
    end: event.endDateTime,
    isPublic: event.isPublic,
    notes: isPrivileged ? event.notes : undefined,
    color: getColorByType(event.type as string),
    textColor: '#ffffff',
  }))

  return NextResponse.json(formatted)
}

export async function POST(req: NextRequest) {
  const payload = await getPayload({ config })
  const hdrs = await getHeaders()
  const { user } = await payload.auth({ headers: hdrs })

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const role = user.role as string
  if (role !== 'pastor' && role !== 'secretaria') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()

  const event = await payload.create({
    collection: 'pastor-schedule',
    data: {
      title: body.title,
      type: body.type,
      startDateTime: body.startDateTime,
      endDateTime: body.endDateTime,
      isPublic: body.isPublic ?? false,
      notes: body.notes ?? '',
      createdBy: user.id,
    },
  })

  return NextResponse.json(event, { status: 201 })
}
