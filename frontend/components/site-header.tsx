'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletButton } from '@/components/WalletButton';
import { NotificationCenter } from '@/components/NotificationCenter';
import { WalletHeaderDisplay } from '@/components/wallet/WalletHeaderDisplay';
import { WalletDetailsModal } from '@/components/wallet/WalletDetailsModal';
import { useAuth } from '@/lib/auth/AuthContext';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Organizations', href: '/organizations' },
  { label: 'Features', href: '/features' },
  { label: 'Governance', href: '/governance' },
  { label: 'History', href: '/history' },
  { label: 'Settings', href: '/settings' },
];

export function SiteHeader() {
  const { user, loadingWallet } = useAuth();
  const [walletDetailsOpen, setWalletDetailsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="flex h-20 shrink-0 items-center gap-2 border-b bg-background px-6">
        <div className="flex items-center gap-2 mr-8">
           {/* Logo or Brand Name */}
           <div className="flex items-center gap-2 font-bold text-xl">
             <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
               N
             </div>
             <span>Nexus</span>
           </div>
        </div>

        <nav className="flex items-center gap-1 bg-muted/50 p-1 rounded-full">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium transition-all duration-200",
                pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href))
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-4">
          <NotificationCenter />

          {/* Show wallet display if user has auto-generated wallet */}
          {user?.aptosWallet && (
            <WalletHeaderDisplay
              wallet={user.aptosWallet}
              loading={loadingWallet}
              onViewWallet={() => setWalletDetailsOpen(true)}
              onViewTransactions={() => {
                setWalletDetailsOpen(true);
              }}
            />
          )}

          {/* Wallet-based authentication */}
          <WalletButton />
        </div>
      </header>

      {/* Wallet Details Modal */}
      {user?.aptosWallet && (
        <WalletDetailsModal
          wallet={user.aptosWallet}
          open={walletDetailsOpen}
          onOpenChange={setWalletDetailsOpen}
        />
      )}
    </>
  );
}
