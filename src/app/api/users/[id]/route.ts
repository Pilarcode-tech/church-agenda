import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: req.headers })

  if (!user) {
    return NextResponse.json(
      { errors: [{ message: 'Usuário não autenticado.' }] },
      { status: 401 },
    )
  }

  const { id } = await params
  const isAdmin = user.role === 'pastor' || user.role === 'secretaria'
  const isSelf = String(user.id) === String(id)

  if (!isAdmin && !isSelf) {
    return NextResponse.json(
      { errors: [{ message: 'Sem permissão para editar este usuário.' }] },
      { status: 403 },
    )
  }

  try {
    const body = await req.json()

    // Non-admins can only update their own profile fields
    const data: Record<string, any> = {}
    if (isAdmin) {
      if (body.name !== undefined) data.name = body.name
      if (body.email !== undefined) data.email = body.email
      if (body.role !== undefined) data.role = body.role
      if (body.active !== undefined) data.active = body.active
    }
    // Both admin and self can update these
    if (body.name !== undefined) data.name = body.name
    if (body.ministerio !== undefined) data.ministerio = body.ministerio
    if (body.phone !== undefined) data.phone = body.phone
    if (body.password) data.password = body.password

    const updated = await payload.update({
      collection: 'users',
      id: Number(id),
      data,
      overrideAccess: true,
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    const message = error?.message || 'Erro ao atualizar usuário.'
    return NextResponse.json(
      { errors: [{ message }] },
      { status: 400 },
    )
  }
}
