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
      { startDateTime: { less_than: end } },
      { endDateTime: { greater_than: start } },
    ]
  }

  // Líderes veem todos os eventos, mas os privados aparecem como "Ocupado"
  // (a visibilidade é controlada na formatação abaixo, não na query)

  const events = await payload.find({
    collection: 'pastor-schedule',
    where,
    sort: 'startDateTime',
    limit: 200,
    depth: 1,
  })

  const formatted = events.docs.map((event) => {
    const canSeeDetails = event.isPublic || isPrivileged
    return {
      id: event.id,
      title: canSeeDetails ? event.title : 'Ocupado',
      type: canSeeDetails ? event.type : 'bloqueio',
      start: event.startDateTime,
      end: event.endDateTime,
      isPublic: event.isPublic,
      notes: isPrivileged ? event.notes : undefined,
      color: canSeeDetails ? getColorByType(event.type as string) : '#9CA3AF',
      textColor: '#ffffff',
    }
  })

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
