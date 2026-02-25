import { getPayload } from 'payload'
import config from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const payload = await getPayload({ config })
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })

  if (!user) {
    return NextResponse.json({ errors: [{ message: 'Usuário não autenticado.' }] }, { status: 401 })
  }

  if (user.role !== 'pastor' && user.role !== 'secretaria') {
    return NextResponse.json({ errors: [{ message: 'Sem permissão.' }] }, { status: 403 })
  }

  try {
    const body = await req.json()
    const created = await payload.create({
      collection: 'users',
      data: body,
      overrideAccess: true,
    })
    return NextResponse.json(created, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao criar usuário'
    return NextResponse.json({ errors: [{ message }] }, { status: 400 })
  }
}
