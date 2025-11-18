import { redirect } from 'next/navigation'
import { getUser, getProfile } from '@/lib/actions/auth'
import Sidebar from '@/components/layout/sidebar'
import Header from '@/components/layout/header'
import { SidebarProvider } from '@/components/layout/sidebar-layout'
import { DashboardLayoutWrapper } from '@/components/layout/dashboard-layout-wrapper'
import { SessionProvider } from '@/components/providers/session-provider'
import { ToastProvider } from '@/components/providers/toast-provider'
import { SkipLinks } from '@/components/ui/skip-link'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  const profile = await getProfile()

  return (
    <SessionProvider>
      <SidebarProvider>
        <ToastProvider />
        <SkipLinks />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
          <Sidebar profile={profile} />
          <DashboardLayoutWrapper>
            <Header user={user} profile={profile} />
            <main id="main-content" className="py-8 px-4 sm:px-6 lg:px-8">
              {children}
            </main>
          </DashboardLayoutWrapper>
        </div>
      </SidebarProvider>
    </SessionProvider>
  )
}
