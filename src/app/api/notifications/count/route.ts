import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(req: NextRequest) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: req.headers })

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
