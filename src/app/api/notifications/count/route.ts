import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getApiUser } from '@/lib/auth'

export async function GET() {
  const payload = await getPayload({ config })
  const user = await getApiUser()

  if (!user) {
    return NextResponse.json(
      { errors: [{ message: 'Usuário não autenticado.' }] },
      { status: 401 },
    )
  }

  const result = await payload.count({
    collection: 'notifications',
    where: {
      and: [
        { recipient: { equals: user.id } },
        { read: { equals: false } },
      ],
    },
    overrideAccess: true,
  })

  return NextResponse.json({ count: result.totalDocs })
}
