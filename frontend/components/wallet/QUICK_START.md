# Wallet Components - Quick Start Guide

## 5-Minute Integration

### Step 1: Import Components
```tsx
import {
  WalletDashboardCard,
  WalletHeaderDisplay,
  WalletDetailsModal,
  AddressDisplay,
} from '@/components/wallet';
```

### Step 2: Use in Your Component
```tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { WalletDashboardCard, WalletDetailsModal } from '@/components/wallet';

export default function Dashboard() {
  const { user } = useAuth();
  const [detailsOpen, setDetailsOpen] = useState(false);

  if (!user?.aptosWallet) return null;

  return (
    <>
      <WalletDashboardCard
        wallet={user.aptosWallet}
        onViewDetails={() => setDetailsOpen(true)}
      />

      <WalletDetailsModal
        wallet={user.aptosWallet}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </>
  );
}
```

### Step 3: Done!
That's it! The wallet card will display on your dashboard.

## Common Use Cases

### Display Address in Form
```tsx
import { AddressDisplay } from '@/components/wallet';

<AddressDisplay
  address={user.aptosWallet.address}
  copyable
/>
```

### Show Wallet in Header
```tsx
import { WalletHeaderDisplay } from '@/components/wallet';

<WalletHeaderDisplay
  wallet={user.aptosWallet}
  onViewWallet={() => setDetailsOpen(true)}
/>
```

### Welcome New Users
```tsx
import { WalletWelcomeModal } from '@/components/wallet';

<WalletWelcomeModal
  wallet={user.aptosWallet}
/>
```

### Notify Users
```tsx
import { WalletNotificationBanner } from '@/components/wallet';

<WalletNotificationBanner
  onViewWallet={handleView}
  onLearnMore={handleLearn}
/>
```

### Add Education
```tsx
import { EducationPanel } from '@/components/wallet';

<EducationPanel />
```

## Props Cheat Sheet

### WalletDashboardCard
- `wallet`: AptosWallet (required)
- `onViewDetails`: () => void
- `className`: string

### WalletHeaderDisplay
- `wallet`: AptosWallet (required)
- `loading`: boolean
- `onViewWallet`: () => void
- `onViewTransactions`: () => void
- `className`: string

### WalletDetailsModal
- `wallet`: AptosWallet (required)
- `open`: boolean (required)
- `onOpenChange`: (open: boolean) => void (required)

### AddressDisplay
- `address`: string (required)
- `format`: 'short' | 'full' (default: 'short')
- `copyable`: boolean (default: true)
- `linkToExplorer`: boolean (default: false)
- `showQR`: boolean (default: false)
- `network`: string (default: 'testnet')
- `className`: string

## API Functions

```tsx
import {
  getWalletBalance,
  formatBalance,
  formatAddress,
  getExplorerUrl,
} from '@/lib/api/wallet';

// Get balance
const balance = await getWalletBalance(address);

// Format for display
const formatted = formatBalance(balance);

// Shorten address
const short = formatAddress(address); // "0x1234...5678"

// Get explorer URL
const url = getExplorerUrl(address, 'testnet');
```

## Access Wallet Data

```tsx
import { useAuth } from '@/lib/auth/AuthContext';

function MyComponent() {
  const { user, loadingWallet, refreshWallet } = useAuth();

  // Check if wallet exists
  if (!user?.aptosWallet) return null;

  // Access wallet data
  const { address, publicKey, balance, network } = user.aptosWallet;

  // Refresh wallet
  await refreshWallet();
}
```

## Styling

All components use Tailwind CSS and accept `className` prop:

```tsx
<WalletDashboardCard
  wallet={wallet}
  className="shadow-xl border-2"
/>
```

## Loading States

```tsx
import { WalletDashboardCardSkeleton } from '@/components/wallet';

{loadingWallet ? (
  <WalletDashboardCardSkeleton />
) : (
  <WalletDashboardCard wallet={wallet} />
)}
```

## Responsive Design

Components are mobile-first and automatically responsive:

```tsx
// Full width on mobile, fixed width on desktop
<div className="w-full lg:w-96">
  <WalletDashboardCard wallet={wallet} />
</div>
```

## Error Handling

```tsx
try {
  const balance = await getWalletBalance(address);
} catch (error) {
  console.error('Failed to fetch balance:', error);
  // Show error to user
}
```

## Need More Help?

- **Full Documentation:** See `README.md`
- **Integration Guide:** See `INTEGRATION_GUIDE.md`
- **Examples:** See `__tests__/WalletComponents.test.tsx`
- **Types:** See `/lib/auth/AuthContext.tsx`

## Troubleshooting

**Q: Wallet not showing?**
A: Check `user?.aptosWallet` exists and backend endpoint is working

**Q: Balance not updating?**
A: Call `refreshWallet()` from useAuth hook

**Q: TypeScript errors?**
A: Import types from `@/lib/auth/AuthContext`

**Q: Styling issues?**
A: Ensure Tailwind CSS is configured and globals.css is imported

## Quick Tips

1. Always check `user?.aptosWallet` before rendering
2. Use loading states for better UX
3. Handle errors gracefully
4. Test on mobile devices
5. Use TypeScript for type safety

---

**Ready to integrate?** Start with `WalletDashboardCard` on your dashboard!
