/**
 * Wallet Utility Functions
 *
 * Helper functions for wallet operations and formatting
 */

import { Network } from '@/lib/types/wallet';

/**
 * Format wallet address to shortened version
 * @param address Full wallet address
 * @param startChars Number of characters to show at start (default: 6)
 * @param endChars Number of characters to show at end (default: 4)
 */
export function formatAddress(
  address: string,
  startChars: number = 6,
  endChars: number = 4
): string {
  if (!address || address.length <= startChars + endChars) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Validate Aptos address format
 * @param address Address to validate
 */
export function isValidAptosAddress(address: string): boolean {
  // Aptos addresses are 64 character hex strings (with or without 0x prefix)
  const hexRegex = /^(0x)?[a-fA-F0-9]{64}$/;
  return hexRegex.test(address);
}

/**
 * Normalize Aptos address (add 0x prefix if missing)
 * @param address Address to normalize
 */
export function normalizeAddress(address: string): string {
  if (!address) return '';
  return address.startsWith('0x') ? address : `0x${address}`;
}

/**
 * Get network configuration
 * @param network Network name
 */
export function getNetworkConfig(network: Network) {
  const configs = {
    [Network.MAINNET]: {
      name: Network.MAINNET,
      chainId: '1',
      url: 'https://fullnode.mainnet.aptoslabs.com/v1',
      faucetUrl: null,
      explorerUrl: 'https://explorer.aptoslabs.com',
    },
    [Network.TESTNET]: {
      name: Network.TESTNET,
      chainId: '2',
      url: 'https://fullnode.testnet.aptoslabs.com/v1',
      faucetUrl: 'https://faucet.testnet.aptoslabs.com',
      explorerUrl: 'https://explorer.aptoslabs.com/?network=testnet',
    },
    [Network.DEVNET]: {
      name: Network.DEVNET,
      chainId: '3',
      url: 'https://fullnode.devnet.aptoslabs.com/v1',
      faucetUrl: 'https://faucet.devnet.aptoslabs.com',
      explorerUrl: 'https://explorer.aptoslabs.com/?network=devnet',
    },
    [Network.LOCALNET]: {
      name: Network.LOCALNET,
      chainId: '4',
      url: 'http://localhost:8080/v1',
      faucetUrl: 'http://localhost:8081',
      explorerUrl: null,
    },
  };

  return configs[network] || configs[Network.TESTNET];
}

/**
 * Get transaction explorer URL
 * @param txHash Transaction hash
 * @param network Network name
 */
export function getTxExplorerUrl(txHash: string, network: Network): string {
  const config = getNetworkConfig(network);
  if (!config.explorerUrl) return '';
  return `${config.explorerUrl}/txn/${txHash}`;
}

/**
 * Get account explorer URL
 * @param address Account address
 * @param network Network name
 */
export function getAccountExplorerUrl(address: string, network: Network): string {
  const config = getNetworkConfig(network);
  if (!config.explorerUrl) return '';
  return `${config.explorerUrl}/account/${address}`;
}

/**
 * Convert Octas to APT
 * @param octas Amount in Octas (1 APT = 100,000,000 Octas)
 */
export function octasToApt(octas: string | number): string {
  const OCTAS_PER_APT = 100_000_000;
  const amount = typeof octas === 'string' ? parseFloat(octas) : octas;
  return (amount / OCTAS_PER_APT).toFixed(8);
}

/**
 * Convert APT to Octas
 * @param apt Amount in APT
 */
export function aptToOctas(apt: string | number): string {
  const OCTAS_PER_APT = 100_000_000;
  const amount = typeof apt === 'string' ? parseFloat(apt) : apt;
  return Math.floor(amount * OCTAS_PER_APT).toString();
}

/**
 * Format APT amount with proper decimals
 * @param amount Amount in APT
 * @param decimals Number of decimal places (default: 4)
 */
export function formatAptAmount(amount: string | number, decimals: number = 4): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0';
  return num.toFixed(decimals);
}

/**
 * Check if wallet provider is available
 * @param walletName Name of wallet to check
 */
export function isWalletAvailable(walletName: string): boolean {
  if (typeof window === 'undefined') return false;

  const walletMap: Record<string, string> = {
    Petra: 'aptos',
    Martian: 'martian',
    Pontem: 'pontem',
    Nightly: 'nightly',
  };

  const key = walletMap[walletName];
  if (!key) return false;

  if (walletName === 'Nightly') {
    return !!(window as any).nightly?.aptos;
  }

  return !!(window as any)[key];
}

/**
 * Wait for wallet to be available
 * @param walletName Name of wallet to wait for
 * @param timeout Timeout in milliseconds (default: 3000)
 */
export function waitForWallet(
  walletName: string,
  timeout: number = 3000
): Promise<boolean> {
  return new Promise((resolve) => {
    if (isWalletAvailable(walletName)) {
      resolve(true);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      if (isWalletAvailable(walletName)) {
        clearInterval(interval);
        resolve(true);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        resolve(false);
      }
    }, 100);
  });
}
