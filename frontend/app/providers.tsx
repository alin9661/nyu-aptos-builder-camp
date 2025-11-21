'use client';

import { AuthProvider } from '@/lib/auth/AuthContext';
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { Network } from '@aptos-labs/ts-sdk';
import { toast } from '@/components/ui/toast';
import { ThemeProvider } from '@/components/theme-provider';

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
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
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

            // Display user-friendly error messages
            const errorMessage = error instanceof Error ? error.message : 'Unknown wallet error';

            // Common wallet error messages
            if (errorMessage.includes('User rejected')) {
              toast.error('Connection rejected', {
                description: 'You rejected the wallet connection request.',
              });
            } else if (errorMessage.includes('not installed') || errorMessage.includes('No wallet')) {
              toast.error('Wallet not found', {
                description: 'Please install a compatible Aptos wallet (e.g., Petra).',
              });
            } else if (errorMessage.includes('network')) {
              toast.error('Network error', {
                description: 'Please check your wallet is connected to the correct network.',
              });
            } else {
              toast.error('Wallet error', {
                description: errorMessage,
              });
            }
          }}
        >
          {children}
        </AptosWalletAdapterProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
