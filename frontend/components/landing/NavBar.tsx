'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletButton } from '@/components/WalletButton';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Features', href: '/features' },
  { label: 'Governance', href: '/governance' },
  { label: 'Treasury', href: '/treasury' },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="flex h-20 shrink-0 items-center gap-2 border-b bg-background px-6">
      <div className="flex items-center gap-2 mr-8">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
            N
          </div>
          <span>Nexus</span>
        </Link>
      </div>

      <nav className="hidden md:flex items-center gap-1 bg-muted/50 p-1 rounded-full">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "px-6 py-2 rounded-full text-sm font-medium transition-all duration-200",
              pathname === item.href
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-4">
        <WalletButton />
      </div>
    </nav>
  );
}
