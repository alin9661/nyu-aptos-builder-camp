# Aptos Wallet Integration - Nexus Platform

Comprehensive wallet integration guide for the Nexus governance platform built on Aptos.

## Overview

This implementation provides full-featured Aptos wallet support including:

- **Multi-Wallet Support**: Petra, Martian, Pontem, Nightly, and WalletConnect
- **Network Switching**: Mainnet, Testnet, Devnet, and Localnet
- **Transaction Signing**: Full support for transaction and message signing
- **Auto-Reconnect**: Automatic reconnection to previously connected wallets
- **TypeScript**: Full type safety throughout the integration

## Architecture

```
frontend/lib/wallet/
├── WalletProvider.tsx     # Main wallet provider with context
├── utils.ts               # Utility functions for wallet operations
└── index.ts              # Module exports

frontend/lib/types/
└── wallet.ts             # TypeScript type definitions

frontend/components/
└── WalletButton.tsx      # Wallet connection UI component
```

## Installation

No additional packages are required! This implementation uses the native wallet providers injected by browser extensions.

### Optional: Enhanced Wallet Adapter (Alternative Approach)

If you prefer using the official Aptos Wallet Adapter, install:

```bash
npm install @aptos-labs/wallet-adapter-react @aptos-labs/wallet-adapter-core
npm install petra-plugin-wallet-adapter martian-wallet-adapter pontem-wallet-adapter
```

However, our custom implementation is more lightweight and provides all necessary functionality.

## Usage

### 1. Basic Connection

The wallet provider is already integrated in your app layout. To use it in any component:

```tsx
'use client';

import { useWallet } from '@/lib/wallet';

export function MyComponent() {
  const { connected, account, connect, disconnect } = useWallet();

  if (!connected) {
    return <button onClick={connect}>Connect Wallet</button>;
  }

  return (
    <div>
      <p>Connected: {account?.address}</p>
      <button onClick={disconnect}>Disconnect</button>
    </div>
  );
}
```

### 2. Signing Transactions

```tsx
import { useWallet } from '@/lib/wallet';
import { TransactionPayload } from '@/lib/types/wallet';

export function ProposalVoting() {
  const { signAndSubmitTransaction, account } = useWallet();

  const handleVote = async (proposalId: number, vote: boolean) => {
    const payload: TransactionPayload = {
      type: 'entry_function_payload',
      function: '0x123::governance::vote',
      type_arguments: [],
      arguments: [proposalId, vote],
    };

    try {
      const response = await signAndSubmitTransaction(payload);
      console.log('Transaction hash:', response.hash);
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };

  return (
    <button onClick={() => handleVote(1, true)}>
      Vote Yes
    </button>
  );
}
```

### 3. Signing Messages

```tsx
import { useWallet } from '@/lib/wallet';

export function MessageSigning() {
  const { signMessage } = useWallet();

  const handleSign = async () => {
    try {
      const response = await signMessage({
        message: 'Welcome to Nexus!',
        nonce: Date.now().toString(),
      });
      console.log('Signature:', response.signature);
    } catch (error) {
      console.error('Signing failed:', error);
    }
  };

  return <button onClick={handleSign}>Sign Message</button>;
}
```

### 4. Network Switching

```tsx
import { useWallet } from '@/lib/wallet';
import { Network } from '@/lib/types/wallet';

export function NetworkSelector() {
  const { network, switchNetwork } = useWallet();

  return (
    <div>
      <p>Current Network: {network?.name}</p>
      <button onClick={() => switchNetwork(Network.MAINNET)}>
        Switch to Mainnet
      </button>
      <button onClick={() => switchNetwork(Network.TESTNET)}>
        Switch to Testnet
      </button>
    </div>
  );
}
```

### 5. Wallet Selection

```tsx
import { useWallet } from '@/lib/wallet';
import { WalletName } from '@/lib/types/wallet';

export function WalletSelector() {
  const { wallets, select, connect } = useWallet();

  const handleSelectWallet = async (walletName: WalletName) => {
    try {
      select(walletName);
      await connect();
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  return (
    <div>
      {wallets.map((wallet) => (
        <button
          key={wallet.name}
          onClick={() => handleSelectWallet(wallet.name)}
          disabled={wallet.readyState !== 'Installed'}
        >
          {wallet.name}
          {wallet.readyState !== 'Installed' && ' (Not Installed)'}
        </button>
      ))}
    </div>
  );
}
```

## Utility Functions

### Address Formatting

```tsx
import { formatAddress } from '@/lib/wallet';

const address = '0x1234567890abcdef...';
const short = formatAddress(address); // "0x1234...cdef"
```

### Amount Conversion

```tsx
import { octasToApt, aptToOctas } from '@/lib/wallet';

const octas = '100000000';
const apt = octasToApt(octas); // "1.00000000"

const aptAmount = '1.5';
const octasAmount = aptToOctas(aptAmount); // "150000000"
```

### Explorer Links

```tsx
import { getTxExplorerUrl, getAccountExplorerUrl } from '@/lib/wallet';
import { Network } from '@/lib/types/wallet';

const txUrl = getTxExplorerUrl('0xabc...', Network.TESTNET);
const accountUrl = getAccountExplorerUrl('0x123...', Network.TESTNET);
```

## API Reference

### WalletContextState

```typescript
interface WalletContextState {
  // Connection state
  connected: boolean;
  connecting: boolean;
  disconnecting: boolean;

  // Account & Network
  account: WalletAccount | null;
  network: NetworkInfo | null;

  // Wallet management
  wallet: WalletAdapter | null;
  wallets: WalletAdapter[];

  // Methods
  select: (walletName: WalletName) => void;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signAndSubmitTransaction: (tx: TransactionPayload) => Promise<PendingTransaction>;
  signMessage: (msg: SignMessagePayload) => Promise<SignMessageResponse>;
  switchNetwork: (network: Network) => Promise<void>;
}
```

### TransactionPayload

```typescript
interface TransactionPayload {
  type: 'entry_function_payload';
  function: string; // "address::module::function"
  type_arguments: string[];
  arguments: any[];
}
```

### WalletAccount

```typescript
interface WalletAccount {
  address: string;
  publicKey: string | string[];
  authKey?: string;
  minKeysRequired?: number;
}
```

## Error Handling

```tsx
import { useWallet } from '@/lib/wallet';
import { WalletError } from '@/lib/types/wallet';

export function SafeComponent() {
  const { connect } = useWallet();

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      if (error instanceof WalletError) {
        switch (error.code) {
          case 'WALLET_NOT_FOUND':
            alert('Please install a wallet extension');
            break;
          case 'CONNECTION_FAILED':
            alert('Failed to connect. Please try again.');
            break;
          default:
            alert(error.message);
        }
      }
    }
  };

  return <button onClick={handleConnect}>Connect</button>;
}
```

## Supported Wallets

### Petra Wallet
- **Website**: https://petra.app/
- **Chrome Extension**: Available in Chrome Web Store
- **Features**: Full transaction and message signing support

### Martian Wallet
- **Website**: https://martianwallet.xyz/
- **Chrome Extension**: Available in Chrome Web Store
- **Features**: Multi-chain support, full Aptos integration

### Pontem Wallet
- **Website**: https://pontem.network/
- **Chrome Extension**: Available in Chrome Web Store
- **Features**: Aptos native, integrated DEX

### Nightly Wallet
- **Website**: https://nightly.app/
- **Chrome Extension**: Available in Chrome Web Store
- **Features**: Multi-chain support

## Configuration

### Auto-Connect

Control auto-reconnect behavior in `app/layout.tsx`:

```tsx
<WalletProvider autoConnect={true}>
  {children}
</WalletProvider>
```

### Default Network

Set the default network:

```tsx
import { Network } from '@/lib/types/wallet';

<WalletProvider defaultNetwork={Network.TESTNET}>
  {children}
</WalletProvider>
```

## Best Practices

1. **Always check connection status** before signing transactions
2. **Handle errors gracefully** with user-friendly messages
3. **Use TypeScript types** for type safety
4. **Validate addresses** before using them in transactions
5. **Test on testnet** before deploying to mainnet
6. **Monitor network changes** and handle them appropriately

## Testing

### Local Testing

1. Install Petra wallet extension
2. Create a test account
3. Get testnet tokens from faucet: https://faucet.testnet.aptoslabs.com
4. Test wallet connection and transactions

### Integration Testing

```tsx
import { renderHook } from '@testing-library/react';
import { useWallet } from '@/lib/wallet';

test('wallet connects successfully', async () => {
  const { result } = renderHook(() => useWallet());
  // Add your test assertions
});
```

## Troubleshooting

### Wallet Not Detected
- Ensure the wallet extension is installed
- Refresh the page after installation
- Check browser console for errors

### Transaction Fails
- Verify sufficient balance for gas fees
- Check transaction payload format
- Ensure connected to correct network

### Network Mismatch
- Use `switchNetwork()` to change networks
- Verify contract addresses match the network

## Security Considerations

1. **Never store private keys** in your application
2. **Always validate user inputs** before signing
3. **Use HTTPS** in production
4. **Implement transaction limits** for high-value operations
5. **Verify contract addresses** before interactions

## Migration from Old Provider

If migrating from the old `AptosWalletProvider`:

```tsx
// Old
import { useWallet } from '@/lib/wallet/AptosWalletProvider';

// New
import { useWallet } from '@/lib/wallet';
// or
import { useWallet } from '@/lib/wallet/WalletProvider';
```

The API is mostly compatible, but adds:
- Multi-wallet support via `select()`
- Enhanced error handling with `WalletError`
- Network switching with `switchNetwork()`
- Message signing with `signMessage()`

## Resources

- **Aptos Developer Docs**: https://aptos.dev
- **Aptos TypeScript SDK**: https://github.com/aptos-labs/aptos-core/tree/main/ecosystem/typescript/sdk
- **Aptos Explorer**: https://explorer.aptoslabs.com
- **Testnet Faucet**: https://faucet.testnet.aptoslabs.com

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the Aptos developer documentation
3. Contact the development team

---

**Built for Nexus - NYU Aptos Governance Platform**
