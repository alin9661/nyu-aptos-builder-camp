'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Wallet state interface
interface WalletState {
  connected: boolean;
  address: string | null;
  network: string | null;
  connecting: boolean;
  error: string | null;
}

// Wallet context interface
interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  signAndSubmitTransaction: (transaction: any) => Promise<any>;
  wallet: boolean; // Alias for connected
  account: { address: string } | null; // Account object with address
}

// Create context
const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Provider props
interface AptosWalletProviderProps {
  children: ReactNode;
}

/**
 * Aptos Wallet Provider
 *
 * This is a basic wallet integration setup.
 * For production, consider using @aptos-labs/wallet-adapter-react
 * which provides a more robust solution with support for multiple wallets.
 *
 * Installation:
 * npm install @aptos-labs/wallet-adapter-react @aptos-labs/wallet-adapter-ant-design
 * npm install petra-plugin-wallet-adapter @aptos-labs/wallet-adapter-core
 */
export function AptosWalletProvider({ children }: AptosWalletProviderProps) {
  const [state, setState] = useState<WalletState>({
    connected: false,
    address: null,
    network: null,
    connecting: false,
    error: null,
  });

  // Check if wallet is already connected on mount
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      // @ts-ignore - Petra wallet injects window.aptos
      if (typeof window !== 'undefined' && window.aptos) {
        // @ts-ignore
        const account = await window.aptos.account();
        if (account) {
          setState({
            connected: true,
            address: account.address,
            // @ts-ignore
            network: await window.aptos.network(),
            connecting: false,
            error: null,
          });
        }
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };

  const connect = async () => {
    try {
      setState((prev) => ({ ...prev, connecting: true, error: null }));

      // @ts-ignore - Petra wallet injects window.aptos
      if (typeof window === 'undefined' || !window.aptos) {
        throw new Error('Petra wallet not found. Please install Petra wallet extension.');
      }

      // @ts-ignore
      const response = await window.aptos.connect();
      // @ts-ignore
      const network = await window.aptos.network();

      setState({
        connected: true,
        address: response.address,
        network,
        connecting: false,
        error: null,
      });
    } catch (error) {
      setState({
        connected: false,
        address: null,
        network: null,
        connecting: false,
        error: error instanceof Error ? error.message : 'Failed to connect wallet',
      });
      throw error;
    }
  };

  const disconnect = () => {
    try {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.aptos) {
        // @ts-ignore
        window.aptos.disconnect();
      }

      setState({
        connected: false,
        address: null,
        network: null,
        connecting: false,
        error: null,
      });
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  const signAndSubmitTransaction = async (transaction: any) => {
    try {
      // @ts-ignore
      if (typeof window === 'undefined' || !window.aptos) {
        throw new Error('Petra wallet not found');
      }

      if (!state.connected) {
        throw new Error('Wallet not connected');
      }

      // @ts-ignore
      const response = await window.aptos.signAndSubmitTransaction(transaction);
      return response;
    } catch (error) {
      console.error('Error signing transaction:', error);
      throw error;
    }
  };

  const value: WalletContextType = {
    ...state,
    connect,
    disconnect,
    signAndSubmitTransaction,
    wallet: state.connected, // Alias for compatibility
    account: state.address ? { address: state.address } : null, // Account object
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

/**
 * Hook to use wallet context
 */
export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within AptosWalletProvider');
  }
  return context;
}

/**
 * Alias for useWallet (for compatibility)
 */
export function useAptosWallet() {
  return useWallet();
}
