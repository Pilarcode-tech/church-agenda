import { getPayload } from 'payload'
import config from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payload = await getPayload({ config })
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })

  if (!user) {
    return NextResponse.json({ errors: [{ message: 'Usuário não autenticado.' }] }, { status: 401 })
  }

  const isAdmin = user.role === 'pastor' || user.role === 'secretaria'
  const isSelf = String(user.id) === id

  if (!isAdmin && !isSelf) {
    return NextResponse.json({ errors: [{ message: 'Sem permissão.' }] }, { status: 403 })
  }

  try {
    const body = await req.json()
    const updated = await payload.update({
      collection: 'users',
      id: Number(id),
      data: body,
      overrideAccess: true,
    })
    return NextResponse.json(updated)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao atualizar usuário'
    return NextResponse.json({ errors: [{ message }] }, { status: 400 })
  }
}
