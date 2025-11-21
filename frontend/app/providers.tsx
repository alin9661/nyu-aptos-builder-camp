'use client';

import { Auth0Provider } from '@auth0/nextjs-auth0/client';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { Network } from '@aptos-labs/ts-sdk';
import { NotificationCenterProvider } from '@/components/NotificationCenter';

/**
 * Root Providers Component
 *
 * Enhanced Aptos Wallet Adapter configuration following official best practices:
 * - Supports all AIP-62 compliant wallets (Petra, Pontem, Martian, Nightly, etc.)
 * - Auto-reconnects to previously connected wallet
 * - Proper error handling and network configuration
 */
export function Providers({ children }: { children: React.ReactNode }) {
  // Get network from environment, default to testnet
  const network = (process.env.NEXT_PUBLIC_APTOS_NETWORK || 'testnet') as string;
  const aptosNetwork = network === 'mainnet' ? Network.MAINNET : Network.TESTNET;

  return (
    <Auth0Provider>
      <AuthProvider>
        <NotificationCenterProvider>
          <AptosWalletAdapterProvider
            // Empty array = support all AIP-62 standard wallets
            // Wallets will auto-detect if installed
            optInWallets={[]}
            // Auto-connect to previously connected wallet on page reload
            autoConnect={true}
            // Enhanced dapp configuration
            dappConfig={{
              network: aptosNetwork,
              // Optional: Add API key for production rate limits
              ...(process.env.NEXT_PUBLIC_APTOS_API_KEY && {
                aptosApiKey: process.env.NEXT_PUBLIC_APTOS_API_KEY,
              }),
            }}
            // Error handling callback
            onError={(error) => {
              console.error('Wallet adapter error:', error);
              // TODO: Add toast notification for user-facing errors
            }}
          >
            {children}
          </AptosWalletAdapterProvider>
        </NotificationCenterProvider>
      </AuthProvider>
    </Auth0Provider>
  );
}
