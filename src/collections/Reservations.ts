import { CollectionConfig } from 'payload'

const Reservations: CollectionConfig = {
  slug: 'reservations',
  labels: { singular: 'Reserva', plural: 'Reservas' },
  admin: {
    useAsTitle: 'title',
    group: 'Reservas',
    defaultColumns: ['title', 'space', 'startDateTime', 'requestedBy', 'status'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Nome do evento / reunião',
      required: true,
    },
    {
      name: 'space',
      type: 'relationship',
      relationTo: 'spaces',
      label: 'Espaço',
      required: true,
    },
    {
      name: 'requestedBy',
      type: 'relationship',
      relationTo: 'users',
      label: 'Solicitante',
      required: true,
    },
    {
      name: 'eventType',
      type: 'select',
      label: 'Tipo de evento',
      required: true,
      options: [
        { label: 'Reunião', value: 'reuniao' },
        { label: 'Evento', value: 'evento' },
        { label: 'Ensaio', value: 'ensaio' },
        { label: 'Gravação', value: 'gravacao' },
        { label: 'Culto especial', value: 'culto_especial' },
        { label: 'Outro', value: 'outro' },
      ],
    },
    {
      name: 'startDateTime',
      type: 'date',
      label: 'Início',
      required: true,
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'endDateTime',
      type: 'date',
      label: 'Fim',
      required: true,
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'attendeesCount',
      type: 'number',
      label: 'Número estimado de pessoas',
    },
    {
      name: 'resourcesNeeded',
      type: 'array',
      label: 'Recursos necessários',
      fields: [
        { name: 'resource', type: 'text', label: 'Recurso' },
      ],
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
        { label: 'Cancelado', value: 'cancelado' },
      ],
    },
    {
      name: 'responseNote',
      type: 'textarea',
      label: 'Observação da secretaria',
    },
    {
      name: 'approvedBy',
      type: 'relationship',
      relationTo: 'users',
      label: 'Aprovado por',
      admin: { readOnly: true },
    },
  ],
  hooks: {
    // Define status automático conforme configuração do espaço
    beforeChange: [
      async ({ req, data, operation }) => {
        if (operation === 'create' && data.space) {
          const space = await req.payload.findByID({
            collection: 'spaces',
            id: data.space,
          })
          if (space && !space.requiresApproval) {
            data.status = 'aprovado'
            data.approvedBy = req.user?.id
          }
        }
        return data
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

export default Reservations
