# Wallet Components Integration Guide

Step-by-step guide for integrating auto-generated Aptos wallet components into your application.

## Prerequisites

1. Backend API endpoint: `GET /api/auth/wallet-info` must be implemented
2. AuthContext must be set up with wallet support
3. All required dependencies installed

## Step 1: Set Up AuthContext

The AuthContext has been enhanced to include wallet state. Make sure your app is wrapped with the AuthProvider:

```tsx
// app/layout.tsx
import { AuthProvider } from '@/lib/auth/AuthContext';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

## Step 2: Display Wallet in Dashboard

Add the wallet dashboard card to your main dashboard:

```tsx
// app/dashboard/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  WalletDashboardCard,
  WalletDetailsModal,
  WalletWelcomeModal,
  WalletNotificationBanner,
} from '@/components/wallet';

export default function DashboardPage() {
  const { user, loadingWallet } = useAuth();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [educationOpen, setEducationOpen] = useState(false);

  if (!user) return <div>Please log in</div>;

  return (
    <div className="container-mobile py-8">
      {/* Welcome banner for new users */}
      {user.aptosWallet && (
        <WalletNotificationBanner
          onViewWallet={() => setDetailsOpen(true)}
          onLearnMore={() => setEducationOpen(true)}
          className="mb-6"
        />
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Wallet Card */}
        {user.aptosWallet && (
          <WalletDashboardCard
            wallet={user.aptosWallet}
            onViewDetails={() => setDetailsOpen(true)}
          />
        )}

        {/* Other dashboard cards */}
        {/* ... */}
      </div>

      {/* Modals */}
      {user.aptosWallet && (
        <>
          <WalletWelcomeModal
            wallet={user.aptosWallet}
            onLearnMore={() => setEducationOpen(true)}
          />

          <WalletDetailsModal
            wallet={user.aptosWallet}
            open={detailsOpen}
            onOpenChange={setDetailsOpen}
          />
        </>
      )}
    </div>
  );
}
```

## Step 3: Update Header with Wallet Display

The site header has already been updated with wallet display. If you need to add it to a custom header:

```tsx
// components/MyCustomHeader.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  WalletHeaderDisplay,
  WalletDetailsModal,
} from '@/components/wallet';

export function MyCustomHeader() {
  const { user, loadingWallet } = useAuth();
  const [walletDetailsOpen, setWalletDetailsOpen] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between p-4">
        <h1>My App</h1>

        <div className="flex items-center gap-4">
          {user?.aptosWallet && (
            <WalletHeaderDisplay
              wallet={user.aptosWallet}
              loading={loadingWallet}
              onViewWallet={() => setWalletDetailsOpen(true)}
            />
          )}
        </div>
      </header>

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
```

## Step 4: Add Profile Settings Section

Add wallet information to user profile/settings page:

```tsx
// app/settings/page.tsx
'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { AddressDisplay } from '@/components/wallet';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, Download, ExternalLink } from 'lucide-react';
import { exportWalletInfo, getExplorerUrl } from '@/lib/api/wallet';

export default function SettingsPage() {
  const { user } = useAuth();

  const handleExportWallet = async () => {
    const data = await exportWalletInfo();
    if (data) {
      // Download as JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'wallet-info.json';
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  if (!user?.aptosWallet) {
    return <div>No wallet found</div>;
  }

  return (
    <div className="container-mobile py-8">
      <Card>
        <CardHeader>
          <CardTitle>Aptos Wallet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Address */}
          <div>
            <label className="text-sm font-medium">Wallet Address</label>
            <AddressDisplay
              address={user.aptosWallet.address}
              format="full"
              copyable
              linkToExplorer
              network={user.aptosWallet.network}
            />
          </div>

          {/* Info Alert */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>Auto-Generated Wallet</AlertTitle>
            <AlertDescription>
              This wallet was automatically generated for you when you created your account.
              Your private keys are encrypted and securely stored.
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => window.open(
                getExplorerUrl(user.aptosWallet.address, user.aptosWallet.network),
                '_blank'
              )}
            >
              <ExternalLink className="h-4 w-4" />
              View in Explorer
            </Button>
            <Button variant="outline" onClick={handleExportWallet}>
              <Download className="h-4 w-4" />
              Download Backup Info
            </Button>
          </div>

          {/* Security Info */}
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Your private keys are encrypted with AES-256-GCM</p>
            <p>• Keys are stored in a secure environment</p>
            <p>• We cannot recover your keys if server data is lost</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

## Step 5: Display Address in Forms

When creating forms that need wallet addresses (e.g., reimbursement requests):

```tsx
// components/ReimbursementForm.tsx
'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { AddressDisplay } from '@/components/wallet';
import { Label } from '@/components/ui/label';

export function ReimbursementForm() {
  const { user } = useAuth();

  return (
    <form className="space-y-4">
      {/* Other form fields */}

      {/* Recipient Wallet */}
      <div className="space-y-2">
        <Label>Recipient Wallet Address</Label>
        {user?.aptosWallet ? (
          <AddressDisplay
            address={user.aptosWallet.address}
            format="short"
            copyable
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            No wallet connected
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Reimbursements will be sent to this address
        </p>
      </div>

      {/* Other form fields */}
    </form>
  );
}
```

## Step 6: Add Education Resources

Create a help/education page:

```tsx
// app/help/wallet/page.tsx
'use client';

import { EducationPanel } from '@/components/wallet';

export default function WalletHelpPage() {
  return (
    <div className="container-mobile py-8">
      <h1 className="text-3xl font-bold mb-6">Wallet Help</h1>
      <EducationPanel />
    </div>
  );
}
```

## Step 7: Handle Loading States

Show loading states while wallet info is being fetched:

```tsx
'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { WalletDashboardCardSkeleton } from '@/components/wallet';

export function WalletSection() {
  const { user, loadingWallet } = useAuth();

  if (loadingWallet) {
    return <WalletDashboardCardSkeleton />;
  }

  if (!user?.aptosWallet) {
    return (
      <div className="text-center py-12">
        <p>No wallet found</p>
      </div>
    );
  }

  return <WalletDashboardCard wallet={user.aptosWallet} />;
}
```

## Step 8: Handle Errors Gracefully

Implement error handling for wallet operations:

```tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export function WalletErrorHandler() {
  const { user, refreshWallet } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = async () => {
    try {
      setError(null);
      await refreshWallet();
    } catch (err) {
      setError('Failed to refresh wallet information');
    }
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
```

## Step 9: Implement Mobile-Responsive Layout

Use the responsive utilities:

```tsx
'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import {
  WalletHeaderDisplay,
  WalletHeaderDisplayCompact,
} from '@/components/wallet';

export function ResponsiveWalletDisplay() {
  const { user, loadingWallet } = useAuth();

  if (!user?.aptosWallet) return null;

  return (
    <>
      {/* Desktop version */}
      <div className="hidden md:block">
        <WalletHeaderDisplay
          wallet={user.aptosWallet}
          loading={loadingWallet}
        />
      </div>

      {/* Mobile version */}
      <div className="block md:hidden">
        <WalletHeaderDisplayCompact
          wallet={user.aptosWallet}
          loading={loadingWallet}
        />
      </div>
    </>
  );
}
```

## Step 10: Add Custom Styling (Optional)

Apply custom styling to wallet components:

```tsx
import { WalletDashboardCard } from '@/components/wallet';

<WalletDashboardCard
  wallet={wallet}
  className="custom-wallet-card shadow-xl"
/>
```

## Common Patterns

### Pattern 1: Wallet Required Guard

Create a guard component for wallet-required features:

```tsx
// components/WalletRequired.tsx
'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export function WalletRequired({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (!user?.aptosWallet) {
    return (
      <Alert>
        <AlertDescription>
          You need a wallet to access this feature.
          <Button variant="link" className="ml-2">
            Learn More
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}

// Usage
<WalletRequired>
  <ReimbursementForm />
</WalletRequired>
```

### Pattern 2: Wallet Balance Display

Create reusable balance display:

```tsx
// components/WalletBalance.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { getWalletBalance, formatBalance } from '@/lib/api/wallet';
import { Skeleton } from '@/components/ui/skeleton';

export function WalletBalance() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.aptosWallet) {
      fetchBalance();
    }
  }, [user?.aptosWallet]);

  const fetchBalance = async () => {
    if (!user?.aptosWallet) return;

    setLoading(true);
    const bal = await getWalletBalance(user.aptosWallet.address);
    setBalance(bal);
    setLoading(false);
  };

  if (!user?.aptosWallet) return null;

  if (loading) {
    return <Skeleton className="h-8 w-24" />;
  }

  return (
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-bold">
        {formatBalance(balance || '0')}
      </span>
      <span className="text-sm text-muted-foreground">APT</span>
    </div>
  );
}
```

## Troubleshooting

### Issue: Wallet info not loading

**Solution:** Check that:
1. Backend endpoint `/api/auth/wallet-info` is implemented
2. User is authenticated
3. Access token is valid
4. Network connectivity is stable

### Issue: Components not styling correctly

**Solution:** Ensure:
1. Tailwind CSS is configured
2. globals.css is imported in layout
3. All required UI components are installed

### Issue: TypeScript errors

**Solution:** Make sure:
1. AptosWallet type is exported from AuthContext
2. All imports are correct
3. TypeScript is configured properly

## Next Steps

1. Test all components on different screen sizes
2. Verify accessibility with screen readers
3. Test with real wallet data from backend
4. Monitor performance and optimize if needed
5. Gather user feedback and iterate

## Support

For issues or questions:
- Check component documentation in README.md
- Review test files for usage examples
- Contact development team
