import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getApiUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const payload = await getPayload({ config })
  const user = await getApiUser()

  if (!user) {
    return NextResponse.json(
      { errors: [{ message: 'Usuário não autenticado.' }] },
      { status: 401 },
    )
  }

  const { searchParams } = new URL(req.url)
  const limit = Number(searchParams.get('limit')) || 20
  const unreadOnly = searchParams.get('unread') === 'true'

  const where: any = { recipient: { equals: user.id } }
  if (unreadOnly) {
    where.read = { equals: false }
  }

  const result = await payload.find({
    collection: 'notifications',
    where,
    limit,
    sort: '-createdAt',
    depth: 0,
    overrideAccess: true,
  })

  return NextResponse.json({
    docs: result.docs,
    totalDocs: result.totalDocs,
  })
}
