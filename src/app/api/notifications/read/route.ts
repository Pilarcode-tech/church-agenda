import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { headers as getHeaders } from 'next/headers'

export async function POST(req: NextRequest) {
  const payload = await getPayload({ config })
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })

  if (!user) {
    return NextResponse.json(
      { errors: [{ message: 'Usuário não autenticado.' }] },
      { status: 401 },
    )
  }

  const body = await req.json()

  const baseWhere: any = {
    and: [
      { recipient: { equals: user.id } },
      { read: { equals: false } },
    ],
  }

  if (body.ids && Array.isArray(body.ids)) {
    baseWhere.and.push({ id: { in: body.ids } })
  } else if (body.types && Array.isArray(body.types)) {
    baseWhere.and.push({ type: { in: body.types } })
  }
  // if body.all === true, no additional filter needed — marks all unread

  await payload.update({
    collection: 'notifications',
    where: baseWhere,
    data: { read: true },
    overrideAccess: true,
  })

  return NextResponse.json({ success: true })
}
