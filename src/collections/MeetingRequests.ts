import { CollectionConfig } from 'payload'

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
      name: 'reason',
      type: 'text',
      label: 'Motivo da reunião',
      required: true,
    },
    {
      name: 'estimatedDuration',
      type: 'number',
      label: 'Duração estimada (minutos)',
      defaultValue: 30,
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
  ],
  hooks: {
    // Ao aprovar, criar automaticamente na agenda do pastor
    afterChange: [
      async ({ req, doc, operation }) => {
        if (operation === 'update' && doc.status === 'aprovado' && doc.confirmedDateTime) {
          await req.payload.create({
            collection: 'pastor-schedule',
            data: {
              title: `Reunião — ${doc.reason}`,
              type: 'reuniao',
              startDateTime: doc.confirmedDateTime,
              endDateTime: new Date(new Date(doc.confirmedDateTime).getTime() + doc.estimatedDuration * 60000).toISOString(),
              isPublic: false,
              notes: `Solicitado por: ${doc.requestedBy}`,
              createdBy: req.user?.id,
            },
          })
        }
      },
    ],
  },
  access: {
    read: ({ req }) => !!req.user,
    create: ({ req }) => !!req.user,
    update: ({ req }) => {
      const role = req.user?.role
      return role === 'pastor' || role === 'secretaria'
    },
    delete: ({ req }) => req.user?.role === 'secretaria',
  },
}

export default MeetingRequests
