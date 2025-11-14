import { redirect } from 'next/navigation'
import { getUser, getProfile } from '@/lib/actions/auth'
import Sidebar from '@/components/layout/sidebar'
import Header from '@/components/layout/header'

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
    <div className="min-h-screen bg-gray-50">
      <Sidebar profile={profile} />
      <div className="lg:pl-64">
        <Header user={user} profile={profile} />
        <main className="py-8 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}
