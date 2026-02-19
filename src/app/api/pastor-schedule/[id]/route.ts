import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { headers as getHeaders } from 'next/headers'

async function authenticate() {
  const payload = await getPayload({ config })
  const hdrs = await getHeaders()
  const { user } = await payload.auth({ headers: hdrs })

  if (!user) return { payload, user: null, error: 'Unauthorized' }

  const role = user.role as string
  if (role !== 'pastor' && role !== 'secretaria') {
    return { payload, user: null, error: 'Forbidden' }
  }

  return { payload, user, error: null }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { payload, user, error } = await authenticate()
  if (!user) return NextResponse.json({ error }, { status: error === 'Forbidden' ? 403 : 401 })

  const { id } = await params
  const body = await req.json()

  const updated = await payload.update({
    collection: 'pastor-schedule',
    id,
    data: body,
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { payload, user, error } = await authenticate()
  if (!user) return NextResponse.json({ error }, { status: error === 'Forbidden' ? 403 : 401 })

  const { id } = await params

  await payload.delete({
    collection: 'pastor-schedule',
    id,
  })

  return NextResponse.json({ success: true })
}
