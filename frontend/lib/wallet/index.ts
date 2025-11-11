/**
 * Wallet Module Exports
 *
 * Central export file for all wallet-related functionality
 */

// Provider and hook
export { WalletProvider, useWallet } from './WalletProvider';

// Types
export type {
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
  WalletContextState,
  AptosWalletProvider,
} from '@/lib/types/wallet';

export { WalletError } from '@/lib/types/wallet';

// Utilities
export {
  formatAddress,
  isValidAptosAddress,
  normalizeAddress,
  getNetworkConfig,
  getTxExplorerUrl,
  getAccountExplorerUrl,
  octasToApt,
  aptToOctas,
  formatAptAmount,
  isWalletAvailable,
  waitForWallet,
} from './utils';
