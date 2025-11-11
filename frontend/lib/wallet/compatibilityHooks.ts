/**
 * Compatibility hooks for bridging between old custom wallet API
 * and the official Aptos wallet adapter
 */

import { useWallet as useOfficialWallet } from '@aptos-labs/wallet-adapter-react';
import { WalletReadyState } from '@aptos-labs/wallet-adapter-core';
import { WalletName } from '@/lib/types/wallet';

/**
 * Enhanced useWallet hook that provides backward compatibility
 * with the old custom wallet provider API
 */
export function useWalletCompat() {
  const {
    account,
    network,
    connected,
    wallet,
    wallets,
    connect: originalConnect,
    disconnect,
    signAndSubmitTransaction,
    signMessage,
    isLoading: connecting,
  } = useOfficialWallet();

  // Convert wallets to match old format
  const walletsCompat = wallets.map((w) => ({
    name: w.name as WalletName,
    url: w.url || '',
    icon: w.icon || '',
    readyState: w.readyState === WalletReadyState.Installed
      ? 'Installed'
      : w.readyState === WalletReadyState.NotDetected
      ? 'NotDetected'
      : w.readyState === WalletReadyState.Loadable
      ? 'Loadable'
      : 'Unsupported',
    provider: undefined,
  }));

  // Adapt account to old format
  const accountCompat = account
    ? {
        address: account.address,
        publicKey: account.publicKey || '',
      }
    : null;

  // Adapt network to old format
  const networkCompat = network
    ? {
        name: network.name,
        chainId: network.chainId?.toString() || '',
        url: network.url || '',
      }
    : null;

  // Create a select function for backward compatibility
  // In the new API, we don't need to select before connecting
  const select = (_walletName: WalletName) => {
    // This is now a no-op since connect() handles selection
    console.log('Wallet selection is now handled by connect()');
  };

  // Wrap connect to match old signature
  const connect = async (walletName?: string) => {
    if (walletName) {
      await originalConnect(walletName);
    } else if (wallet) {
      await originalConnect(wallet.name);
    } else {
      // Try to connect to first installed wallet
      const installedWallet = wallets.find(
        (w) => w.readyState === WalletReadyState.Installed
      );
      if (installedWallet) {
        await originalConnect(installedWallet.name);
      }
    }
  };

  // Adapt signMessage to handle old format
  const signMessageCompat = async (message: any) => {
    if (!signMessage) {
      throw new Error('Wallet does not support message signing');
    }

    // Handle both old and new message formats
    const messagePayload = typeof message === 'string'
      ? { message, nonce: Date.now().toString() }
      : message;

    return await signMessage(messagePayload);
  };

  return {
    connected,
    connecting,
    disconnecting: false, // Official adapter doesn't expose this
    account: accountCompat,
    network: networkCompat,
    wallet: wallet
      ? {
          name: wallet.name as WalletName,
          url: wallet.url || '',
          icon: wallet.icon || '',
          readyState: walletsCompat.find((w) => w.name === wallet.name)?.readyState || 'NotDetected',
          provider: undefined,
        }
      : null,
    wallets: walletsCompat,
    select,
    connect,
    disconnect,
    signAndSubmitTransaction,
    signMessage: signMessageCompat,
    switchNetwork: async () => {
      console.warn('Network switching not yet implemented in compatibility layer');
    },
  };
}
