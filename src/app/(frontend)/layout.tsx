import { getCurrentUser } from '@/lib/auth'
import { Sidebar } from '@/components/Sidebar/Sidebar'
import { UserMenu } from '@/components/UserMenu'
import { MobileLayout } from '@/components/MobileLayout'
import { ToastProvider } from '@/components/ui/Toast'
import { redirect } from 'next/navigation'

export default async function FrontendLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const userData = {
    name: user.name as string,
    role: user.role as string,
    email: user.email || '',
  }

  const userMenuEl = <UserMenu user={userData} />

  return (
    <ToastProvider>
      <MobileLayout
        sidebar={
          <Sidebar
            user={userData}
            userMenu={userMenuEl}
          />
        }
        userMenu={userMenuEl}
      >
        {children}
      </MobileLayout>
    </ToastProvider>
  )
}
