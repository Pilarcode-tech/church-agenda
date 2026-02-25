import { CollectionConfig } from 'payload'

const Notifications: CollectionConfig = {
  slug: 'notifications',
  labels: { singular: 'Notificação', plural: 'Notificações' },
  admin: {
    group: 'Sistema',
    defaultColumns: ['recipient', 'type', 'message', 'read', 'createdAt'],
  },
  fields: [
    {
      name: 'recipient',
      type: 'relationship',
      relationTo: 'users',
      label: 'Destinatário',
      required: true,
      index: true,
    },
    {
      name: 'type',
      type: 'select',
      label: 'Tipo',
      required: true,
      options: [
        { label: 'Solicitação criada', value: 'REQUEST_CREATED' },
        { label: 'Solicitação aprovada', value: 'REQUEST_APPROVED' },
        { label: 'Solicitação recusada', value: 'REQUEST_REJECTED' },
        { label: 'Solicitação reagendada', value: 'REQUEST_RESCHEDULED' },
        { label: 'Reserva criada', value: 'RESERVATION_CREATED' },
        { label: 'Reserva aprovada', value: 'RESERVATION_APPROVED' },
        { label: 'Reserva recusada', value: 'RESERVATION_REJECTED' },
      ],
    },
    {
      name: 'message',
      type: 'text',
      label: 'Mensagem',
      required: true,
    },
    {
      name: 'sourceCollection',
      type: 'select',
      label: 'Coleção de origem',
      required: true,
      options: [
        { label: 'Solicitações de Reunião', value: 'meeting-requests' },
        { label: 'Reservas', value: 'reservations' },
      ],
    },
    {
      name: 'sourceId',
      type: 'number',
      label: 'ID de origem',
      required: true,
    },
    {
      name: 'read',
      type: 'checkbox',
      label: 'Lida',
      defaultValue: false,
      index: true,
    },
  ],
  access: {
    read: ({ req }) => {
      if (!req.user) return false
      return { recipient: { equals: req.user.id } }
    },
    update: ({ req }) => {
      if (!req.user) return false
      return { recipient: { equals: req.user.id } }
    },
    create: () => false,
    delete: ({ req }) => {
      if (!req.user) return false
      return { recipient: { equals: req.user.id } }
    },
  },
}

export default Notifications
