import { CollectionConfig } from 'payload'

const PastorSchedule: CollectionConfig = {
  slug: 'pastor-schedule',
  labels: { singular: 'Compromisso do Pastor', plural: 'Agenda do Pastor' },
  admin: {
    useAsTitle: 'title',
    group: 'Agenda',
    defaultColumns: ['title', 'type', 'startDateTime', 'endDateTime', 'isPublic'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Título',
      required: true,
    },
    {
      name: 'type',
      type: 'select',
      label: 'Tipo',
      required: true,
      options: [
        { label: 'Reunião', value: 'reuniao' },
        { label: 'Aconselhamento', value: 'aconselhamento' },
        { label: 'Pregação', value: 'pregacao' },
        { label: 'Viagem', value: 'viagem' },
        { label: 'Pessoal', value: 'pessoal' },
        { label: 'Bloqueio', value: 'bloqueio' },
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
      name: 'isPublic',
      type: 'checkbox',
      label: 'Visível para líderes com título?',
      defaultValue: false,
      admin: {
        description: 'Se desmarcado, líderes verão apenas "Ocupado" sem detalhes.',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Observações internas',
      admin: {
        description: 'Visível apenas para pastor e secretaria.',
      },
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      label: 'Criado por',
      admin: { readOnly: true },
    },
  ],
  hooks: {
    beforeChange: [
      ({ req, data }) => {
        if (req.user && !data.createdBy) {
          data.createdBy = req.user.id
        }
        return data
      },
    ],
  },
  access: {
    // Líderes só veem eventos públicos, pastor e secretaria veem tudo
    read: ({ req }) => {
      if (!req.user) return false
      const role = req.user.role
      if (role === 'pastor' || role === 'secretaria') return true
      // Líderes: retorna query que filtra apenas isPublic: true
      return { isPublic: { equals: true } }
    },
    create: ({ req }) => {
      const role = req.user?.role
      return role === 'pastor' || role === 'secretaria'
    },
    update: ({ req }) => {
      const role = req.user?.role
      return role === 'pastor' || role === 'secretaria'
    },
    delete: ({ req }) => {
      const role = req.user?.role
      return role === 'pastor' || role === 'secretaria'
    },
  },
}

export default PastorSchedule
