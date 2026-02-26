import { CollectionConfig } from 'payload'
import { createNotifications, getAdminUserIds } from '@/lib/notifications'

const MeetingRequests: CollectionConfig = {
  slug: 'meeting-requests',
  labels: { singular: 'Solicitação de Reunião', plural: 'Solicitações de Reunião' },
  admin: {
    useAsTitle: 'reason',
    group: 'Agenda',
    defaultColumns: ['requestedBy', 'reason', 'suggestedDate', 'status'],
  },
  fields: [
    {
      name: 'requestedBy',
      type: 'relationship',
      relationTo: 'users',
      label: 'Solicitante',
      required: true,
    },
    {
      name: 'modality',
      type: 'select',
      label: 'Modalidade',
      required: true,
      defaultValue: 'presencial',
      options: [
        { label: 'Presencial', value: 'presencial' },
        { label: 'Online', value: 'online' },
      ],
    },
    {
      name: 'reason',
      type: 'textarea',
      label: 'Assunto / Motivo da reunião',
      required: true,
    },
    {
      name: 'isAllDay',
      type: 'checkbox',
      label: 'Dia inteiro',
      defaultValue: false,
    },
    {
      name: 'estimatedDuration',
      type: 'number',
      label: 'Duração estimada (minutos)',
      defaultValue: 30,
      admin: {
        condition: (data) => !data.isAllDay,
      },
    },
    {
      name: 'suggestedDate',
      type: 'date',
      label: 'Data sugerida',
      required: true,
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      required: true,
      defaultValue: 'pendente',
      options: [
        { label: 'Pendente', value: 'pendente' },
        { label: 'Aprovado', value: 'aprovado' },
        { label: 'Recusado', value: 'recusado' },
        { label: 'Reagendado', value: 'reagendado' },
      ],
    },
    {
      name: 'confirmedDateTime',
      type: 'date',
      label: 'Horário confirmado',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        condition: (data) => data.status === 'aprovado' || data.status === 'reagendado',
      },
    },
    {
      name: 'responseNote',
      type: 'textarea',
      label: 'Mensagem de resposta',
      admin: {
        description: 'Mensagem enviada ao líder ao aprovar, recusar ou reagendar.',
      },
    },
    {
      name: 'seenBy',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      label: 'Visto por',
      admin: { readOnly: true, position: 'sidebar' },
    },
  ],
  hooks: {
    // Ao aprovar, criar automaticamente na agenda do pastor
    afterChange: [
      async ({ req, doc, operation }) => {
        if (operation === 'update' && doc.status === 'aprovado' && doc.confirmedDateTime) {
          try {
            const endDateTime = new Date(new Date(doc.confirmedDateTime).getTime() + (doc.estimatedDuration || 30) * 60000).toISOString()
            const requesterId =
              typeof doc.requestedBy === 'object'
                ? (doc.requestedBy as any).id
                : doc.requestedBy
            await req.payload.create({
              collection: 'pastor-schedule',
              data: {
                title: `Reunião — ${doc.reason}`,
                type: 'reuniao',
                startDateTime: doc.confirmedDateTime,
                endDateTime,
                isPublic: false,
                notes: `Solicitado por: ${typeof doc.requestedBy === 'object' ? (doc.requestedBy as any).name : doc.requestedBy}`,
                createdBy: req.user?.id,
                requestedBy: requesterId,
              },
              overrideAccess: true,
            })
          } catch (error) {
            console.error('Erro ao criar evento na agenda do pastor:', error)
          }
        }
      },
      async ({ req, doc, previousDoc, operation }) => {
        try {
          if (operation === 'create') {
            const adminIds = await getAdminUserIds()
            const requesterName =
              typeof doc.requestedBy === 'object'
                ? (doc.requestedBy as any).name
                : undefined
            const name = requesterName || req.user?.name || 'Alguém'
            const reason = doc.reason?.length > 50 ? doc.reason.slice(0, 50) + '...' : doc.reason
            await createNotifications({
              recipientIds: adminIds,
              excludeUserId: req.user?.id,
              type: 'REQUEST_CREATED',
              message: `${name} solicitou reunião: ${reason}`,
              sourceCollection: 'meeting-requests',
              sourceId: doc.id,
            })
          }

          if (operation === 'update' && previousDoc?.status === 'pendente' && doc.status !== 'pendente') {
            const requesterId =
              typeof doc.requestedBy === 'object'
                ? (doc.requestedBy as any).id
                : doc.requestedBy
            if (requesterId) {
              const typeMap: Record<string, 'REQUEST_APPROVED' | 'REQUEST_REJECTED' | 'REQUEST_RESCHEDULED'> = {
                aprovado: 'REQUEST_APPROVED',
                recusado: 'REQUEST_REJECTED',
                reagendado: 'REQUEST_RESCHEDULED',
              }
              const notifType = typeMap[doc.status]
              if (notifType) {
                const statusLabels: Record<string, string> = {
                  aprovado: 'aprovada',
                  recusado: 'recusada',
                  reagendado: 'reagendada',
                }
                const reason = doc.reason?.length > 40 ? doc.reason.slice(0, 40) + '...' : doc.reason
                await createNotifications({
                  recipientIds: [requesterId],
                  excludeUserId: req.user?.id,
                  type: notifType,
                  message: `Sua solicitação "${reason}" foi ${statusLabels[doc.status]}`,
                  sourceCollection: 'meeting-requests',
                  sourceId: doc.id,
                })
              }
            }
          }
        } catch (error) {
          console.error('Erro ao criar notificação de solicitação:', error)
        }
      },
    ],
  },
  access: {
    read: ({ req }) => {
      if (!req.user) return false
      const role = req.user.role
      if (role === 'pastor' || role === 'secretaria') return true
      return { requestedBy: { equals: req.user.id } }
    },
    create: ({ req }) => !!req.user,
    update: ({ req }) => {
      const role = req.user?.role
      return role === 'pastor' || role === 'secretaria'
    },
    delete: ({ req }) => req.user?.role === 'secretaria',
  },
}

export default MeetingRequests
