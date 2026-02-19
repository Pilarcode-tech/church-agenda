import { CollectionConfig } from 'payload'

const Spaces: CollectionConfig = {
  slug: 'spaces',
  labels: { singular: 'Espaço', plural: 'Espaços' },
  admin: {
    useAsTitle: 'name',
    group: 'Configurações',
    defaultColumns: ['name', 'type', 'capacity', 'requiresApproval', 'active'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Nome do espaço',
      required: true,
    },
    {
      name: 'type',
      type: 'select',
      label: 'Tipo',
      required: true,
      options: [
        { label: 'Templo Principal', value: 'templo' },
        { label: 'Sala de Reunião', value: 'sala' },
        { label: 'Salão de Eventos', value: 'salao' },
        { label: 'Estúdio', value: 'estudio' },
      ],
    },
    {
      name: 'capacity',
      type: 'number',
      label: 'Capacidade (pessoas)',
    },
    {
      name: 'resources',
      type: 'array',
      label: 'Recursos disponíveis',
      fields: [
        {
          name: 'resource',
          type: 'text',
          label: 'Recurso',
        },
      ],
    },
    {
      name: 'requiresApproval',
      type: 'checkbox',
      label: 'Requer aprovação da secretaria?',
      defaultValue: false,
      admin: {
        description: 'Se marcado, reservas entram como Pendente. Se desmarcado, são aprovadas automaticamente.',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Descrição',
    },
    {
      name: 'active',
      type: 'checkbox',
      label: 'Espaço ativo',
      defaultValue: true,
    },
  ],
  access: {
    read: ({ req }) => !!req.user,
    create: ({ req }) => req.user?.role === 'secretaria' || req.user?.role === 'pastor',
    update: ({ req }) => req.user?.role === 'secretaria' || req.user?.role === 'pastor',
    delete: ({ req }) => req.user?.role === 'secretaria',
  },
}

export default Spaces
