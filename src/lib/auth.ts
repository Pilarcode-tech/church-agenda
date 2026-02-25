import { getPayload } from 'payload'
import config from '@payload-config'
import { headers as getHeaders, cookies } from 'next/headers'

export async function getCurrentUser() {
  const payload = await getPayload({ config })
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })
  return user || null
}

/**
 * Auth para API Route Handlers.
 * Usa o token do cookie via Authorization header para evitar
 * o check de CSRF do Payload (que bloqueia quando Origin não
 * está na lista csrf do config).
 */
export async function getApiUser() {
  const payload = await getPayload({ config })
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value
  if (!token) return null
  const { user } = await payload.auth({
    headers: new Headers({ Authorization: `JWT ${token}` }),
  })
  return user || null
}
