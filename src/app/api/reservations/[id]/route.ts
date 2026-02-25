import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { headers as getHeaders } from 'next/headers'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getPayload({ config })
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })

  if (!user) {
    return NextResponse.json(
      { errors: [{ message: 'Usuário não autenticado.' }] },
      { status: 401 },
    )
  }

  const role = user.role as string
  if (role !== 'pastor' && role !== 'secretaria') {
    return NextResponse.json(
      { errors: [{ message: 'Sem permissão para esta ação.' }] },
      { status: 403 },
    )
  }

  try {
    const { id } = await params
    const body = await req.json()

    const reservation = await payload.update({
      collection: 'reservations',
      id,
      data: {
        status: body.status,
        responseNote: body.responseNote,
        approvedBy: user.id,
      } as any,
      user,
    })

    return NextResponse.json(reservation)
  } catch (error: any) {
    return NextResponse.json(
      { errors: [{ message: error?.message || 'Erro ao atualizar reserva.' }] },
      { status: 400 },
    )
  }
}
