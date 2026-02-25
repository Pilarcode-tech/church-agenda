import { getCurrentUser } from '@/lib/auth'
import { Topbar } from '@/components/Topbar'
import { ProfileForm } from './ProfileForm'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const userData = {
    id: String(user.id),
    name: user.name as string,
    email: user.email || '',
    role: (user.role as string) ?? 'lider',
    ministerio: (user.ministerio as string) ?? '',
    phone: (user.phone as string) ?? '',
  }

  return (
    <>
      <Topbar
        title="Meu Perfil"
        subtitle="Edite suas informações pessoais"
      />
      <div className="p-4 md:p-6 max-w-2xl">
        <ProfileForm user={userData} />
      </div>
    </>
  )
}
