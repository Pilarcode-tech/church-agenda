import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(req: NextRequest) {
  const payload = await getPayload({ config })
  const { searchParams } = new URL(req.url)

  const space = searchParams.get('space')
  const start = searchParams.get('start')
  const end = searchParams.get('end')

  if (!space || !start || !end) {
    return NextResponse.json({ hasConflict: false })
  }

  const conflicts = await payload.find({
    collection: 'reservations',
    where: {
      and: [
        { space: { equals: space } },
        { status: { equals: 'aprovado' } },
        { startDateTime: { less_than: end } },
        { endDateTime: { greater_than: start } },
      ],
    },
    limit: 1,
  })

  return NextResponse.json({ hasConflict: conflicts.docs.length > 0 })
}
