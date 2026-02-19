import { getPayload } from 'payload'
import config from './payload.config'

async function seed() {
  const payloadInstance = await getPayload({ config })

  // Criar espaços
  await payloadInstance.create({
    collection: 'spaces',
    data: {
      name: 'Templo Principal',
      type: 'templo',
      capacity: 800,
      requiresApproval: true,
      resources: [
        { resource: 'Som profissional' },
        { resource: 'Projeção' },
        { resource: 'Transmissão ao vivo' },
        { resource: 'Iluminação cênica' },
      ],
      active: true,
    },
  })

  await payloadInstance.create({
    collection: 'spaces',
    data: {
      name: 'Sala de Líderes',
      type: 'sala',
      capacity: 30,
      requiresApproval: false,
      resources: [
        { resource: 'Projetor' },
        { resource: 'Whiteboard' },
        { resource: 'Ar condicionado' },
      ],
      active: true,
    },
  })

  await payloadInstance.create({
    collection: 'spaces',
    data: {
      name: 'Sala de Aconselhamento',
      type: 'sala',
      capacity: 6,
      requiresApproval: false,
      resources: [
        { resource: 'Privativo' },
        { resource: 'Ar condicionado' },
      ],
      active: true,
    },
  })

  console.log('Seed concluído — espaços criados.')
  process.exit(0)
}

seed()
