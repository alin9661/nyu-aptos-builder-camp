# Wallet Components

Comprehensive React components for displaying and managing auto-generated Aptos wallet information.

## Components Overview

### 1. AddressDisplay
Reusable component for displaying wallet addresses with various features.

**Props:**
- `address` (string): The wallet address to display
- `format` ('short' | 'full'): Display format (default: 'short')
- `copyable` (boolean): Show copy button (default: true)
- `linkToExplorer` (boolean): Show explorer link button (default: false)
- `showQR` (boolean): Show QR code button (default: false)
- `network` (string): Network for explorer link (default: 'testnet')
- `className` (string): Additional CSS classes

**Usage:**
```tsx
import { AddressDisplay } from '@/components/wallet';

<AddressDisplay
  address="0x1234..."
  format="short"
  copyable
  linkToExplorer
  network="testnet"
/>
```

### 2. WalletDashboardCard
Dashboard card component showing wallet overview and balance.

**Props:**
- `wallet` (AptosWallet): Wallet data object
- `onViewDetails` (function): Callback for viewing detailed info
- `className` (string): Additional CSS classes

**Usage:**
```tsx
import { WalletDashboardCard } from '@/components/wallet';

<WalletDashboardCard
  wallet={user.aptosWallet}
  onViewDetails={handleViewDetails}
/>
```

### 3. WalletWelcomeModal
First-time welcome modal with animated confetti celebration.

**Props:**
- `wallet` (AptosWallet): Wallet data object
- `open` (boolean): Control modal visibility
- `onClose` (function): Callback when modal is closed
- `onLearnMore` (function): Callback for "Learn More" action

**Features:**
- Animated confetti effect
- QR code display
- Security information
- One-time display (uses localStorage)

**Usage:**
```tsx
import { WalletWelcomeModal } from '@/components/wallet';

<WalletWelcomeModal
  wallet={user.aptosWallet}
  onClose={handleClose}
  onLearnMore={handleLearnMore}
/>
```

### 4. WalletDetailsModal
Comprehensive modal with multiple tabs for detailed wallet information.

**Tabs:**
1. **Overview**: Address, public key, balance, network info
2. **Transactions**: Transaction history with filtering
3. **Security**: Encryption details and best practices
4. **Education**: Learning resources and guides

**Props:**
- `wallet` (AptosWallet): Wallet data object
- `open` (boolean): Modal visibility state
- `onOpenChange` (function): Callback for state changes

**Usage:**
```tsx
import { WalletDetailsModal } from '@/components/wallet';

<WalletDetailsModal
  wallet={user.aptosWallet}
  open={isOpen}
  onOpenChange={setIsOpen}
/>
```

### 5. WalletNotificationBanner
Banner component for notifying users about their new wallet.

**Variants:**
- `WalletNotificationBanner`: Full banner with actions
- `WalletNotificationBannerCompact`: Compact version
- `WalletSetupSuccessBanner`: Success state banner

**Props:**
- `onViewWallet` (function): Callback for "View Wallet" action
- `onLearnMore` (function): Callback for "Learn More" action
- `className` (string): Additional CSS classes

**Usage:**
```tsx
import { WalletNotificationBanner } from '@/components/wallet';

<WalletNotificationBanner
  onViewWallet={handleViewWallet}
  onLearnMore={handleLearnMore}
/>
```

### 6. EducationPanel
Comprehensive educational resource panel with multiple tabs.

**Tabs:**
1. **Getting Started**: Quick start guide
2. **Aptos**: Blockchain information
3. **Security**: Best practices
4. **Usage**: How to use wallet features
5. **FAQs**: Common questions
6. **Resources**: External links and documentation

**Usage:**
```tsx
import { EducationPanel } from '@/components/wallet';

<EducationPanel />
```

### 7. WalletHeaderDisplay
Header component for displaying wallet in the navigation bar.

**Variants:**
- `WalletHeaderDisplay`: Full header display with dropdown
- `WalletHeaderDisplayCompact`: Compact icon version
- `WalletHeaderDisplaySkeleton`: Loading state

**Props:**
- `wallet` (AptosWallet): Wallet data object
- `loading` (boolean): Loading state
- `onViewWallet` (function): Callback for viewing details
- `onViewTransactions` (function): Callback for viewing transactions
- `className` (string): Additional CSS classes

**Usage:**
```tsx
import { WalletHeaderDisplay } from '@/components/wallet';

<WalletHeaderDisplay
  wallet={user.aptosWallet}
  loading={loadingWallet}
  onViewWallet={handleViewWallet}
  onViewTransactions={handleViewTransactions}
/>
```

## API Services

### wallet.ts
Centralized API service for wallet operations.

**Functions:**
- `getWalletInfo()`: Fetch wallet information
- `getWalletBalance(address)`: Get wallet balance
- `getWalletTransactions(address, limit)`: Get transaction history
- `exportWalletInfo()`: Export public wallet data
- `getExplorerUrl(address, network)`: Generate explorer URL
- `getTransactionExplorerUrl(hash, network)`: Generate transaction URL
- `formatAddress(address, chars)`: Format address for display
- `formatBalance(balance, decimals)`: Format balance for display
- `copyToClipboard(text)`: Copy text to clipboard

**Usage:**
```tsx
import { getWalletBalance, formatBalance } from '@/lib/api/wallet';

const balance = await getWalletBalance(address);
const formatted = formatBalance(balance);
```

## Integration with AuthContext

The wallet components integrate with the enhanced AuthContext:

```tsx
import { useAuth } from '@/lib/auth/AuthContext';

function MyComponent() {
  const { user, loadingWallet, refreshWallet } = useAuth();

  if (loadingWallet) return <WalletSkeleton />;
  if (!user?.aptosWallet) return <NoWallet />;

  return <WalletDashboardCard wallet={user.aptosWallet} />;
}
```

## Styling and Theming

All components use:
- Tailwind CSS for styling
- shadcn/ui component library
- NYU color scheme (violet/purple gradients)
- Dark mode support
- Responsive design (mobile-first)

## Accessibility

All components include:
- ARIA labels on interactive elements
- Keyboard navigation support
- Screen reader compatibility
- Focus management
- Color contrast compliance (WCAG AA)

## Testing

Test suite includes:
- Component rendering tests
- User interaction tests
- API integration tests
- Error handling tests
- Accessibility tests
- Responsive design tests

Run tests:
```bash
npm test components/wallet/__tests__
```

## Requirements

### Dependencies
- React 18+
- Next.js 14+
- Tailwind CSS
- Radix UI primitives
- lucide-react icons

### Optional
- qrcode.react (for QR code generation)
- framer-motion (for enhanced animations)

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Security Considerations

1. **Private Keys**: Never exposed in UI or client-side code
2. **Address Validation**: All addresses are validated before display
3. **HTTPS Only**: All API calls require secure connections
4. **XSS Protection**: All user inputs are sanitized
5. **CSRF Protection**: API endpoints use CSRF tokens

## Performance

- Components use React.memo for optimization
- Lazy loading for heavy components
- Skeleton loaders for better UX
- Debounced API calls
- Efficient re-rendering strategies

## Future Enhancements

- [ ] QR code library integration (qrcode.react)
- [ ] Enhanced animations with framer-motion
- [ ] Real-time balance updates via WebSocket
- [ ] Multi-wallet support
- [ ] Transaction signing interface
- [ ] NFT display support
- [ ] Token portfolio view
- [ ] Wallet import/export (for non-custodial)

## Support

For issues or questions:
1. Check the component documentation above
2. Review the test suite for usage examples
3. Consult the main README for project setup
4. Contact the development team

## License

Same as parent project license.
