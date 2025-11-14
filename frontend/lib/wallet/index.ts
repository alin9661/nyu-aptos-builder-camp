/**
 * Wallet Module Exports
 *
 * Central export file for all wallet-related functionality
 * Now using official Aptos wallet adapter
 */

// Provider and hook from official Aptos wallet adapter
export {
  AptosWalletAdapterProvider as WalletProvider,
  useWallet
} from '@aptos-labs/wallet-adapter-react';

// Re-export core types from official adapter
export type {
  AccountInfo,
  NetworkInfo,
  WalletReadyState,
  InputTransactionData,
  AptosSignAndSubmitTransactionOutput,
  AptosSignMessageInput,
  AptosSignMessageOutput,
} from '@aptos-labs/wallet-adapter-core';

export { NetworkName } from '@aptos-labs/wallet-adapter-core';

// Keep custom types for backward compatibility
export type {
  WalletName,
  WalletAdapter,
  WalletAccount,
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
