import { GlobalConfig } from 'payload'

const ChurchSettings: GlobalConfig = {
  slug: 'church-settings',
  label: 'Configurações da Igreja',
  admin: { group: 'Configurações' },
  fields: [
    {
      name: 'churchName',
      type: 'text',
      label: 'Nome da Igreja',
      defaultValue: 'Igreja Verbo da Vida',
    },
    {
      name: 'availableHoursStart',
      type: 'text',
      label: 'Horário de abertura padrão',
      defaultValue: '08:00',
    },
    {
      name: 'availableHoursEnd',
      type: 'text',
      label: 'Horário de fechamento padrão',
      defaultValue: '22:00',
    },
    {
      name: 'advanceBookingDays',
      type: 'number',
      label: 'Antecedência mínima para reserva (dias)',
      defaultValue: 1,
    },
    {
      name: 'cancelationDeadlineHours',
      type: 'number',
      label: 'Prazo para cancelar sem justificativa (horas)',
      defaultValue: 24,
    },
  ],
  access: {
    read: ({ req }) => !!req.user,
    update: ({ req }) => {
      const role = req.user?.role
      return role === 'pastor' || role === 'secretaria'
    },
  },
}

export default ChurchSettings
