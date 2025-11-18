'use client'

import { ReactNode } from 'react'
import { SidebarProvider, useSidebar } from './sidebar-layout'
import { cn } from '@/lib/utils'

function DashboardContent({ children }: { children: ReactNode }) {
  const { isCollapsed } = useSidebar()

  return (
    <div
      className={cn(
        'transition-all duration-300 ease-in-out',
        isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
      )}
    >
      {children}
    </div>
  )
}

export function DashboardLayoutWrapper({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardContent>{children}</DashboardContent>
    </SidebarProvider>
  )
}
