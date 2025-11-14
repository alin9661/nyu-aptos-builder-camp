'use client';

import { WalletButton } from '@/components/WalletButton'
import { AuthButton } from '@/components/AuthButton'
import { NotificationCenter } from '@/components/NotificationCenter'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useUser } from '@auth0/nextjs-auth0/client'

export function SiteHeader() {
  const { user } = useUser()

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">Nexus Dashboard</h1>
        <div className="ml-auto flex items-center gap-2">
          <NotificationCenter />
          {/* Show AuthButton if Auth0 authenticated, otherwise show WalletButton */}
          {user ? <AuthButton /> : <WalletButton />}
        </div>
      </div>
    </header>
  )
}
