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

  if (user.role !== 'pastor' && user.role !== 'secretaria') {
    return NextResponse.json(
      { errors: [{ message: 'Sem permissão para criar usuários.' }] },
      { status: 403 },
    )
  }

  try {
    const body = await req.json()

    const newUser = await payload.create({
      collection: 'users',
      data: {
        name: body.name,
        email: body.email,
        password: body.password,
        role: body.role || 'lider',
        ministerio: body.ministerio || undefined,
        phone: body.phone || undefined,
        active: body.active ?? true,
      },
      overrideAccess: true,
    })

    return NextResponse.json(newUser, { status: 201 })
  } catch (error: any) {
    const message = error?.message || 'Erro ao criar usuário.'
    return NextResponse.json(
      { errors: [{ message }] },
      { status: 400 },
    )
  }
}
