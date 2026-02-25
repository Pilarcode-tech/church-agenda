import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(req: NextRequest) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: req.headers })

  if (!user) {
    return NextResponse.json(
      { errors: [{ message: 'Usuário não autenticado.' }] },
      { status: 401 },
    )
  }

  try {
    const body = await req.json()

    const reservation = await payload.create({
      collection: 'reservations',
      data: {
        title: body.title,
        space: body.space,
        eventType: body.eventType,
        startDateTime: body.startDateTime,
        endDateTime: body.endDateTime,
        attendeesCount: body.attendeesCount,
        resourcesNeeded: body.resourcesNeeded,
        resourceNotes: body.resourceNotes,
        requestedBy: user.id,
      } as any,
      user,
    })

    return NextResponse.json(reservation, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { errors: [{ message: error?.message || 'Erro ao criar reserva.' }] },
      { status: 400 },
    )
  }
}
