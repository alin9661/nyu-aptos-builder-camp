'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  WalletName,
  Network,
  WalletAdapter,
  WalletAccount,
  NetworkInfo,
  WalletReadyState,
  TransactionPayload,
  SignMessagePayload,
  SignMessageResponse,
  PendingTransaction,
  WalletError,
  WalletContextState,
  AptosWalletProvider as IAptosWalletProvider,
} from '@/lib/types/wallet';

// Create context
const WalletContext = createContext<WalletContextState | undefined>(undefined);

// Provider props
interface WalletProviderProps {
  children: ReactNode;
  autoConnect?: boolean;
  defaultNetwork?: Network;
}

/**
 * Comprehensive Aptos Wallet Provider
 *
 * Supports multiple wallets: Petra, Martian, Pontem, Nightly, and WalletConnect
 * Features:
 * - Multi-wallet support with automatic detection
 * - Network switching (mainnet/testnet/devnet)
 * - Transaction signing
 * - Message signing
 * - Auto-reconnect functionality
 */
export function WalletProvider({
  children,
  autoConnect = true,
  defaultNetwork = Network.TESTNET,
}: WalletProviderProps) {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [account, setAccount] = useState<WalletAccount | null>(null);
  const [network, setNetwork] = useState<NetworkInfo | null>(null);
  const [wallet, setWallet] = useState<WalletAdapter | null>(null);
  const [wallets, setWallets] = useState<WalletAdapter[]>([]);

  // Get wallet provider from window object
  const getWalletProvider = useCallback((walletName: WalletName): IAptosWalletProvider | null => {
    if (typeof window === 'undefined') return null;

    switch (walletName) {
      case WalletName.Petra:
        return window.aptos || null;
      case WalletName.Martian:
        return window.martian || null;
      case WalletName.Pontem:
        return window.pontem || null;
      case WalletName.Nightly:
        return window.nightly?.aptos || null;
      default:
        return null;
    }
  }, []);

  // Check if wallet is installed
  const checkWalletReadyState = useCallback((walletName: WalletName): WalletReadyState => {
    const provider = getWalletProvider(walletName);
    if (provider) {
      return WalletReadyState.Installed;
    }
    // WalletConnect is always loadable
    if (walletName === WalletName.WalletConnect) {
      return WalletReadyState.Loadable;
    }
    return WalletReadyState.NotDetected;
  }, [getWalletProvider]);

  // Initialize available wallets
  useEffect(() => {
    const initWallets = () => {
      const availableWallets: WalletAdapter[] = [
        {
          name: WalletName.Petra,
          url: 'https://petra.app/',
          icon: 'https://petra.app/favicon.ico',
          readyState: checkWalletReadyState(WalletName.Petra),
          provider: getWalletProvider(WalletName.Petra),
        },
        {
          name: WalletName.Martian,
          url: 'https://martianwallet.xyz/',
          icon: 'https://martianwallet.xyz/favicon.ico',
          readyState: checkWalletReadyState(WalletName.Martian),
          provider: getWalletProvider(WalletName.Martian),
        },
        {
          name: WalletName.Pontem,
          url: 'https://pontem.network/',
          icon: 'https://pontem.network/favicon.ico',
          readyState: checkWalletReadyState(WalletName.Pontem),
          provider: getWalletProvider(WalletName.Pontem),
        },
        {
          name: WalletName.Nightly,
          url: 'https://nightly.app/',
          icon: 'https://nightly.app/favicon.ico',
          readyState: checkWalletReadyState(WalletName.Nightly),
          provider: getWalletProvider(WalletName.Nightly),
        },
      ];

      setWallets(availableWallets);
    };

    initWallets();
  }, [checkWalletReadyState, getWalletProvider]);

  // Get network information
  const getNetworkInfo = useCallback(async (provider: IAptosWalletProvider): Promise<NetworkInfo> => {
    try {
      const networkName = await provider.network();
      const networkMap: Record<string, NetworkInfo> = {
        mainnet: {
          name: Network.MAINNET,
          chainId: '1',
          url: 'https://fullnode.mainnet.aptoslabs.com/v1',
        },
        testnet: {
          name: Network.TESTNET,
          chainId: '2',
          url: 'https://fullnode.testnet.aptoslabs.com/v1',
        },
        devnet: {
          name: Network.DEVNET,
          chainId: '3',
          url: 'https://fullnode.devnet.aptoslabs.com/v1',
        },
      };

      return networkMap[networkName.toLowerCase()] || networkMap.testnet;
    } catch (error) {
      console.error('Error getting network info:', error);
      return {
        name: defaultNetwork,
        chainId: '2',
        url: 'https://fullnode.testnet.aptoslabs.com/v1',
      };
    }
  }, [defaultNetwork]);

  // Select wallet
  const select = useCallback((walletName: WalletName) => {
    const selectedWallet = wallets.find((w) => w.name === walletName);
    if (!selectedWallet) {
      throw new WalletError(`Wallet ${walletName} not found`, 'WALLET_NOT_FOUND');
    }
    if (selectedWallet.readyState === WalletReadyState.NotDetected) {
      throw new WalletError(
        `Wallet ${walletName} is not installed. Please install it from ${selectedWallet.url}`,
        'WALLET_NOT_INSTALLED'
      );
    }
    setWallet(selectedWallet);
  }, [wallets]);

  // Connect wallet
  const connect = useCallback(async () => {
    if (!wallet) {
      throw new WalletError('No wallet selected. Please select a wallet first.', 'NO_WALLET_SELECTED');
    }

    try {
      setConnecting(true);

      const provider = getWalletProvider(wallet.name);
      if (!provider) {
        throw new WalletError(
          `${wallet.name} wallet not found. Please install it from ${wallet.url}`,
          'WALLET_NOT_FOUND'
        );
      }

      // Connect to wallet
      const response = await provider.connect();

      // Get network info
      const networkInfo = await getNetworkInfo(provider);

      // Ensure we're on testnet for this application
      if (networkInfo.name !== Network.TESTNET) {
        try {
          await provider.changeNetwork(Network.TESTNET);
          const updatedNetworkInfo = await getNetworkInfo(provider);
          setNetwork(updatedNetworkInfo);
        } catch (networkError) {
          console.warn('Failed to switch to testnet, proceeding with current network:', networkError);
          setNetwork(networkInfo);
        }
      } else {
        setNetwork(networkInfo);
      }

      // Set account
      setAccount({
        address: response.address,
        publicKey: response.publicKey,
      });
      setConnected(true);

      // Save to localStorage for auto-reconnect
      if (typeof window !== 'undefined') {
        localStorage.setItem('aptos-wallet-name', wallet.name);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setAccount(null);
      setNetwork(null);
      setConnected(false);
      throw new WalletError(
        error instanceof Error ? error.message : 'Failed to connect wallet',
        'CONNECTION_FAILED'
      );
    } finally {
      setConnecting(false);
    }
  }, [wallet, getWalletProvider, getNetworkInfo]);

  // Disconnect wallet
  const disconnect = useCallback(async () => {
    if (!wallet) return;

    try {
      setDisconnecting(true);

      const provider = getWalletProvider(wallet.name);
      if (provider) {
        await provider.disconnect();
      }

      setAccount(null);
      setNetwork(null);
      setConnected(false);
      setWallet(null);

      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('aptos-wallet-name');
      }
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      throw new WalletError(
        error instanceof Error ? error.message : 'Failed to disconnect wallet',
        'DISCONNECTION_FAILED'
      );
    } finally {
      setDisconnecting(false);
    }
  }, [wallet, getWalletProvider]);

  // Sign and submit transaction
  const signAndSubmitTransaction = useCallback(async (
    transaction: TransactionPayload
  ): Promise<PendingTransaction> => {
    if (!connected || !wallet || !account) {
      throw new WalletError('Wallet not connected', 'NOT_CONNECTED');
    }

    const provider = getWalletProvider(wallet.name);
    if (!provider) {
      throw new WalletError('Wallet provider not found', 'PROVIDER_NOT_FOUND');
    }

    try {
      const response = await provider.signAndSubmitTransaction(transaction);
      return response;
    } catch (error) {
      console.error('Error signing transaction:', error);
      throw new WalletError(
        error instanceof Error ? error.message : 'Failed to sign transaction',
        'TRANSACTION_FAILED'
      );
    }
  }, [connected, wallet, account, getWalletProvider]);

  // Sign message
  const signMessage = useCallback(async (
    message: SignMessagePayload
  ): Promise<SignMessageResponse> => {
    if (!connected || !wallet || !account) {
      throw new WalletError('Wallet not connected', 'NOT_CONNECTED');
    }

    const provider = getWalletProvider(wallet.name);
    if (!provider || !provider.signMessage) {
      throw new WalletError('Wallet does not support message signing', 'UNSUPPORTED_METHOD');
    }

    try {
      const response = await provider.signMessage(message);
      return response;
    } catch (error) {
      console.error('Error signing message:', error);
      throw new WalletError(
        error instanceof Error ? error.message : 'Failed to sign message',
        'SIGNING_FAILED'
      );
    }
  }, [connected, wallet, account, getWalletProvider]);

  // Switch network
  const switchNetwork = useCallback(async (newNetwork: Network) => {
    if (!connected || !wallet) {
      throw new WalletError('Wallet not connected', 'NOT_CONNECTED');
    }

    const provider = getWalletProvider(wallet.name);
    if (!provider || !provider.changeNetwork) {
      throw new WalletError('Wallet does not support network switching', 'UNSUPPORTED_METHOD');
    }

    try {
      await provider.changeNetwork(newNetwork);
      const networkInfo = await getNetworkInfo(provider);
      setNetwork(networkInfo);
    } catch (error) {
      console.error('Error switching network:', error);
      throw new WalletError(
        error instanceof Error ? error.message : 'Failed to switch network',
        'NETWORK_SWITCH_FAILED'
      );
    }
  }, [connected, wallet, getWalletProvider, getNetworkInfo]);

  // Auto-connect on mount
  useEffect(() => {
    if (!autoConnect) return;

    const autoConnectWallet = async () => {
      try {
        if (typeof window === 'undefined') return;

        const savedWalletName = localStorage.getItem('aptos-wallet-name') as WalletName | null;
        if (!savedWalletName) return;

        const savedWallet = wallets.find((w) => w.name === savedWalletName);
        if (!savedWallet || savedWallet.readyState !== WalletReadyState.Installed) return;

        const provider = getWalletProvider(savedWalletName);
        if (!provider) return;

        // Check if already connected
        const isConnected = await provider.isConnected();
        if (!isConnected) return;

        // Get account info
        const accountInfo = await provider.account();
        const networkInfo = await getNetworkInfo(provider);

        // Ensure we're on testnet for this application
        if (networkInfo.name !== Network.TESTNET) {
          try {
            await provider.changeNetwork(Network.TESTNET);
            const updatedNetworkInfo = await getNetworkInfo(provider);
            setNetwork(updatedNetworkInfo);
          } catch (networkError) {
            console.warn('Failed to switch to testnet on auto-connect, proceeding with current network:', networkError);
            setNetwork(networkInfo);
          }
        } else {
          setNetwork(networkInfo);
        }

        setWallet(savedWallet);
        setAccount({
          address: accountInfo.address,
          publicKey: accountInfo.publicKey,
        });
        setConnected(true);
      } catch (error) {
        console.error('Auto-connect failed:', error);
      }
    };

    autoConnectWallet();
  }, [autoConnect, wallets, getWalletProvider, getNetworkInfo]);

  // Listen for account changes
  useEffect(() => {
    if (!wallet || !connected) return;

    const provider = getWalletProvider(wallet.name);
    if (!provider || !provider.onAccountChange) return;

    const handleAccountChange = (newAccount: any) => {
      if (newAccount) {
        setAccount({
          address: newAccount.address,
          publicKey: newAccount.publicKey,
        });
      } else {
        disconnect();
      }
    };

    provider.onAccountChange(handleAccountChange);
  }, [wallet, connected, getWalletProvider, disconnect]);

  // Listen for network changes
  useEffect(() => {
    if (!wallet || !connected) return;

    const provider = getWalletProvider(wallet.name);
    if (!provider || !provider.onNetworkChange) return;

    const handleNetworkChange = async (newNetwork: any) => {
      const networkInfo = await getNetworkInfo(provider);
      setNetwork(networkInfo);
    };

    provider.onNetworkChange(handleNetworkChange);
  }, [wallet, connected, getWalletProvider, getNetworkInfo]);

  const value: WalletContextState = {
    connected,
    connecting,
    disconnecting,
    account,
    network,
    wallet,
    wallets,
    select,
    connect,
    disconnect,
    signAndSubmitTransaction,
    signMessage,
    switchNetwork,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

/**
 * Hook to use wallet context
 */
export function useWallet(): WalletContextState {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
}

/**
 * Alias for useWallet (for compatibility)
 */
export function useAptosWallet(): WalletContextState {
  return useWallet();
}
