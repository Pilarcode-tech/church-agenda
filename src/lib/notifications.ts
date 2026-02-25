import { getPayload } from 'payload'
import config from '@payload-config'

type NotificationType =
  | 'REQUEST_CREATED'
  | 'REQUEST_APPROVED'
  | 'REQUEST_REJECTED'
  | 'REQUEST_RESCHEDULED'
  | 'RESERVATION_CREATED'
  | 'RESERVATION_APPROVED'
  | 'RESERVATION_REJECTED'

type CreateNotificationsParams = {
  recipientIds: number[]
  excludeUserId?: number
  type: NotificationType
  message: string
  sourceCollection: 'meeting-requests' | 'reservations'
  sourceId: number
}

export async function createNotifications({
  recipientIds,
  excludeUserId,
  type,
  message,
  sourceCollection,
  sourceId,
}: CreateNotificationsParams) {
  const payload = await getPayload({ config })

  const filteredIds = excludeUserId
    ? recipientIds.filter((id) => id !== excludeUserId)
    : recipientIds

  if (filteredIds.length === 0) return

  await Promise.all(
    filteredIds.map((recipientId) =>
      payload.create({
        collection: 'notifications',
        data: {
          recipient: recipientId,
          type,
          message,
          sourceCollection,
          sourceId,
          read: false,
        },
        overrideAccess: true,
      }),
    ),
  )
}

export async function getAdminUserIds(): Promise<number[]> {
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'users',
    where: {
      and: [
        { role: { in: ['pastor', 'secretaria'] } },
        { active: { equals: true } },
      ],
    },
    limit: 100,
    depth: 0,
  })

  return result.docs.map((u) => u.id)
}
