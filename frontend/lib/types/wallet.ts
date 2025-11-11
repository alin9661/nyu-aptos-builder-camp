/**
 * Aptos Wallet Integration Type Definitions
 *
 * Comprehensive types for multi-wallet support including:
 * Petra, Martian, Pontem, Nightly, and WalletConnect
 */

// Wallet Names
export enum WalletName {
  Petra = 'Petra',
  Martian = 'Martian',
  Pontem = 'Pontem',
  Nightly = 'Nightly',
  WalletConnect = 'WalletConnect',
}

// Network Types
export enum Network {
  MAINNET = 'mainnet',
  TESTNET = 'testnet',
  DEVNET = 'devnet',
  LOCALNET = 'localnet',
}

// Wallet Ready State
export enum WalletReadyState {
  Installed = 'Installed',
  NotDetected = 'NotDetected',
  Loadable = 'Loadable',
  Unsupported = 'Unsupported',
}

// Wallet Adapter Interface
export interface WalletAdapter {
  name: WalletName;
  url: string;
  icon: string;
  readyState: WalletReadyState;
  provider?: any;
}

// Wallet Account
export interface WalletAccount {
  address: string;
  publicKey: string | string[];
  authKey?: string;
  minKeysRequired?: number;
}

// Network Information
export interface NetworkInfo {
  name: Network;
  chainId: string;
  url: string;
}

// Transaction Payload
export interface TransactionPayload {
  type: 'entry_function_payload';
  function: string; // format: "address::module::function"
  type_arguments: string[];
  arguments: any[];
}

// Sign Message Types
export interface SignMessagePayload {
  address?: boolean;
  application?: boolean;
  chainId?: boolean;
  message: string;
  nonce: string;
}

export interface SignMessageResponse {
  address?: string;
  application?: string;
  chainId?: number;
  fullMessage: string;
  message: string;
  nonce: string;
  prefix: string;
  signature: string | string[];
}

// Pending Transaction
export interface PendingTransaction {
  hash: string;
  sender: string;
  sequence_number: string;
  max_gas_amount: string;
  gas_unit_price: string;
  expiration_timestamp_secs: string;
  payload: TransactionPayload;
}

// Wallet Error
export class WalletError extends Error {
  code: string;

  constructor(message: string, code: string = 'WALLET_ERROR') {
    super(message);
    this.name = 'WalletError';
    this.code = code;
  }
}

// Wallet Context State
export interface WalletContextState {
  // Connection State
  connected: boolean;
  connecting: boolean;
  disconnecting: boolean;

  // Account & Network
  account: WalletAccount | null;
  network: NetworkInfo | null;

  // Wallet Management
  wallet: WalletAdapter | null;
  wallets: WalletAdapter[];

  // Methods
  select: (walletName: WalletName) => void;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signAndSubmitTransaction: (transaction: TransactionPayload) => Promise<PendingTransaction>;
  signMessage: (message: SignMessagePayload) => Promise<SignMessageResponse>;
  switchNetwork: (network: Network) => Promise<void>;
}

// Window Wallet Provider Types
export interface AptosWalletProvider {
  connect: () => Promise<{ address: string; publicKey: string }>;
  disconnect: () => Promise<void>;
  account: () => Promise<{ address: string; publicKey: string }>;
  isConnected: () => Promise<boolean>;
  network: () => Promise<string>;
  signAndSubmitTransaction: (transaction: any) => Promise<PendingTransaction>;
  signMessage: (message: SignMessagePayload) => Promise<SignMessageResponse>;
  changeNetwork: (network: string) => Promise<{ success: boolean }>;
  onAccountChange?: (callback: (account: any) => void) => void;
  onNetworkChange?: (callback: (network: any) => void) => void;
}

declare global {
  interface Window {
    aptos?: AptosWalletProvider; // Petra
    martian?: AptosWalletProvider; // Martian
    pontem?: AptosWalletProvider; // Pontem
    nightly?: {
      aptos?: AptosWalletProvider;
    }; // Nightly
  }
}
