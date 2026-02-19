import { CollectionConfig } from 'payload'

const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'name',
    group: 'Gestão',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Nome completo',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      label: 'Perfil de acesso',
      required: true,
      options: [
        { label: 'Pastor', value: 'pastor' },
        { label: 'Secretaria', value: 'secretaria' },
        { label: 'Líder', value: 'lider' },
      ],
      defaultValue: 'lider',
    },
    {
      name: 'ministerio',
      type: 'text',
      label: 'Ministério / Área',
    },
    {
      name: 'phone',
      type: 'text',
      label: 'Telefone (WhatsApp)',
    },
    {
      name: 'active',
      type: 'checkbox',
      label: 'Usuário ativo',
      defaultValue: true,
    },
  ],
  access: {
    read: ({ req }) => !!req.user,
    create: ({ req }) => {
      const role = req.user?.role
      return role === 'pastor' || role === 'secretaria'
    },
    update: ({ req }) => {
      const role = req.user?.role
      return role === 'pastor' || role === 'secretaria'
    },
    delete: ({ req }) => req.user?.role === 'secretaria',
  },
}

export default Users
