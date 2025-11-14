'use client';

import { Auth0Provider } from '@auth0/nextjs-auth0/client';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { NetworkName } from '@aptos-labs/wallet-adapter-core';
import { NotificationCenterProvider } from '@/components/NotificationCenter';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Auth0Provider>
      <AuthProvider>
        <NotificationCenterProvider>
          <AptosWalletAdapterProvider
            optInWallets={["Petra"]}
            autoConnect={true}
            dappConfig={{ network: NetworkName.Testnet }}
            onError={(error) => {
              console.error('Wallet adapter error:', error);
            }}
          >
            {children}
          </AptosWalletAdapterProvider>
        </NotificationCenterProvider>
      </AuthProvider>
    </Auth0Provider>
  );
}
