import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

import Users from './collections/Users'
import Spaces from './collections/Spaces'
import PastorSchedule from './collections/PastorSchedule'
import MeetingRequests from './collections/MeetingRequests'
import Reservations from './collections/Reservations'
import Notifications from './collections/Notifications'
import ChurchSettings from './globals/ChurchSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: '— Igreja Verbo da Vida',
    },
  },
  editor: lexicalEditor({}),
  collections: [
    Users,
    Spaces,
    PastorSchedule,
    MeetingRequests,
    Reservations,
    Notifications,
  ],
  globals: [
    ChurchSettings,
  ],
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
      // Configuração SSL necessária para o Neon em produção
      ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
    },
  }),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  // CORS para permitir o domínio da Vercel
  cors: [
    process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  ].filter(Boolean),
  csrf: [
    process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  ].filter(Boolean),
})
