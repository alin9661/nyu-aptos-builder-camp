"use client"

import {
  IconDotsVertical,
  IconLogout,
  IconUserCircle,
  IconWallet,
  IconShieldLock,
} from "@tabler/icons-react"

import { useWallet } from '@/lib/wallet'
import { useUser } from '@auth0/nextjs-auth0/client'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const { connected, account, disconnect } = useWallet()
  const { user: auth0User } = useUser()

  // Priority: Auth0 user > Wallet > Default user
  const displayName = auth0User?.name ||
    (connected && account?.address
      ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}`
      : user.name)

  const displayEmail = auth0User?.email ||
    (connected ? "Wallet Connected" : user.email)

  const avatarFallback = auth0User
    ? (auth0User.name?.[0]?.toUpperCase() || 'U')
    : (connected ? 'W' : 'U')

  const handleLogout = () => {
    window.location.href = '/auth/logout';
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={auth0User?.picture || user.avatar} alt={displayName} />
                <AvatarFallback className="rounded-lg">
                  {avatarFallback}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{displayName}</span>
                  {auth0User && (
                    <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                      Auth0
                    </Badge>
                  )}
                </div>
                <span className="text-muted-foreground truncate text-xs">
                  {displayEmail}
                </span>
              </div>
              <IconDotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={auth0User?.picture || user.avatar} alt={displayName} />
                  <AvatarFallback className="rounded-lg">
                    {avatarFallback}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{displayName}</span>
                    {auth0User && (
                      <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                        Auth0
                      </Badge>
                    )}
                  </div>
                  <span className="text-muted-foreground truncate text-xs">
                    {displayEmail}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <IconUserCircle />
                Profile
              </DropdownMenuItem>
              {(connected || auth0User) && (
                <DropdownMenuItem onClick={() => {
                  const address = account?.address;
                  if (address) {
                    window.open(`https://explorer.aptoslabs.com/account/${address}?network=testnet`, '_blank');
                  }
                }}>
                  <IconWallet />
                  View on Explorer
                </DropdownMenuItem>
              )}
              {auth0User && auth0User.sub && (
                <DropdownMenuItem disabled>
                  <IconShieldLock />
                  <div className="flex flex-col">
                    <span className="text-xs">User ID</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {auth0User.sub.slice(0, 20)}...
                    </span>
                  </div>
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {connected && (
              <DropdownMenuItem onClick={() => disconnect()}>
                <IconLogout />
                Disconnect Wallet
              </DropdownMenuItem>
            )}
            {auth0User && (
              <DropdownMenuItem onClick={handleLogout}>
                <IconLogout />
                Sign Out
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
