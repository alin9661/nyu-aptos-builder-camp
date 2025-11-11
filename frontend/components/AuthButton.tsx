'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { IconUserCircle, IconLogout, IconLogin, IconShieldLock } from '@tabler/icons-react';

export function AuthButton() {
  const { user, error, isLoading } = useUser();

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
      </Button>
    );
  }

  if (error) {
    console.error('Auth0 error:', error);
  }

  if (!user) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => window.location.href = '/auth/login'}
        className="gap-2"
      >
        <IconLogin className="h-4 w-4" />
        Sign In
      </Button>
    );
  }

  const displayName = user.name || user.email || 'User';
  const userEmail = user.email || '';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <IconUserCircle className="h-4 w-4" />
          <span className="hidden sm:inline">{displayName}</span>
          <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
            Auth0
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{displayName}</p>
            {userEmail && (
              <p className="text-xs text-muted-foreground">{userEmail}</p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user.sub && (
          <DropdownMenuItem disabled>
            <IconShieldLock className="mr-2 h-4 w-4" />
            <div className="flex flex-col">
              <span className="text-xs">User ID</span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {user.sub.slice(0, 20)}...
              </span>
            </div>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => window.location.href = '/auth/logout'}
          className="text-red-600"
        >
          <IconLogout className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
