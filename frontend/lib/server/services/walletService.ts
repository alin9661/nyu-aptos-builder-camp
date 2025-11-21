/**
 * Wallet service for managing Aptos wallets
 * Server-side only - handles wallet generation and private key management
 */

import { Account, Ed25519PrivateKey } from '@aptos-labs/ts-sdk';
import { aptos } from '../config/aptos';
import { encrypt, decrypt } from '../utils/encryption';
import { rawQuery } from '../db/client';

/**
 * Generated wallet information
 */
export interface GeneratedWallet {
  address: string;
  publicKey: string;
  encryptedPrivateKey: string;
}

/**
 * Wallet service for managing Aptos wallets
 */
export class WalletService {
  /**
   * Generate a new Aptos wallet
   * @returns Generated wallet information with encrypted private key
   */
  static async generateWallet(): Promise<GeneratedWallet> {
    try {
      // Generate new Ed25519 account
      const account = Account.generate();

      // Get address and public key
      const address = account.accountAddress.toString();
      const publicKey = account.publicKey.toString();

      // Get private key and encrypt it
      const privateKeyHex = account.privateKey.toString();
      const encryptedPrivateKey = encrypt(privateKeyHex);

      console.log('[WalletService] Generated new Aptos wallet', {
        address,
        publicKey: publicKey.substring(0, 10) + '...',
      });

      return {
        address,
        publicKey,
        encryptedPrivateKey,
      };
    } catch (error) {
      console.error('[WalletService] Failed to generate wallet', error);
      throw new Error('Wallet generation failed');
    }
  }

  /**
   * Create and store a wallet for a user
   * @param ssoId - SSO identifier (NetID)
   * @param ssoProvider - SSO provider (e.g., 'nyu_sso')
   * @param email - User email
   * @param firstName - User first name
   * @param lastName - User last name
   * @returns User information including wallet address
   */
  static async createWalletForUser(
    ssoId: string,
    ssoProvider: string,
    email?: string,
    firstName?: string,
    lastName?: string
  ): Promise<{
    address: string;
    publicKey: string;
    role: string;
    ssoId: string;
    email?: string;
  }> {
    try {
      // Check if user already exists
      const existingUsers = await rawQuery(
        'SELECT address, role, wallet_public_key, email FROM users WHERE sso_id = $1 AND sso_provider = $2',
        [ssoId, ssoProvider]
      );

      if (existingUsers.length > 0) {
        const user = existingUsers[0];
        console.log('[WalletService] User already exists', { ssoId, address: user.address });
        return {
          address: user.address,
          publicKey: user.wallet_public_key,
          role: user.role,
          ssoId,
          email: user.email,
        };
      }

      // Generate new wallet
      const wallet = await this.generateWallet();

      // Determine display name
      const displayName = firstName && lastName
        ? `${firstName} ${lastName}`
        : email?.split('@')[0] || ssoId;

      // Create user with generated wallet
      await rawQuery(
        `INSERT INTO users (
          address,
          role,
          sso_provider,
          sso_id,
          wallet_public_key,
          encrypted_private_key,
          wallet_generated,
          wallet_created_at,
          display_name,
          email,
          first_name,
          last_name
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, $9, $10, $11)`,
        [
          wallet.address,
          'member', // Default role
          ssoProvider,
          ssoId,
          wallet.publicKey,
          wallet.encryptedPrivateKey,
          true,
          displayName,
          email,
          firstName,
          lastName,
        ]
      );

      console.log('[WalletService] Created new user with generated wallet', {
        ssoId,
        address: wallet.address,
        ssoProvider,
      });

      return {
        address: wallet.address,
        publicKey: wallet.publicKey,
        role: 'member',
        ssoId,
        email,
      };
    } catch (error) {
      console.error('[WalletService] Failed to create wallet for user', { error, ssoId });
      throw new Error('Failed to create wallet for user');
    }
  }

  /**
   * Get decrypted account for a user (for transaction signing)
   * SECURITY: This should only be used server-side and never expose the private key
   * @param address - User's wallet address
   * @returns Account instance for signing transactions
   */
  static async getAccountForSigning(address: string): Promise<Account | null> {
    try {
      const users = await rawQuery(
        'SELECT encrypted_private_key FROM users WHERE address = $1 AND wallet_generated = true',
        [address]
      );

      if (users.length === 0) {
        console.warn('[WalletService] No auto-generated wallet found for address', { address });
        return null;
      }

      const user = users[0];

      if (!user.encrypted_private_key) {
        console.warn('[WalletService] No encrypted private key found', { address });
        return null;
      }

      // Decrypt private key
      const privateKeyHex = decrypt(user.encrypted_private_key);

      // Create account from private key
      const privateKey = new Ed25519PrivateKey(privateKeyHex);
      const account = Account.fromPrivateKey({ privateKey });

      console.log('[WalletService] Retrieved account for signing', { address });
      return account;
    } catch (error) {
      console.error('[WalletService] Failed to get account for signing', { error, address });
      return null;
    }
  }

  /**
   * Fund a newly created wallet with test APT (testnet only)
   * @param address - Wallet address to fund
   * @returns Transaction hash if successful
   */
  static async fundWallet(address: string): Promise<string | null> {
    try {
      // Only fund on testnet
      if (process.env.APTOS_NETWORK !== 'testnet') {
        console.warn('[WalletService] Wallet funding only available on testnet', { address });
        return null;
      }

      // Use Aptos faucet to fund the account
      const txn = await aptos.fundAccount({
        accountAddress: address,
        amount: 100_000_000, // 1 APT = 100,000,000 Octas
      });

      console.log('[WalletService] Funded wallet from faucet', {
        address,
        amount: '1 APT',
        txHash: txn.hash,
      });

      return txn.hash;
    } catch (error) {
      console.error('[WalletService] Failed to fund wallet', { error, address });
      return null;
    }
  }

  /**
   * Get wallet balance
   * @param address - Wallet address
   * @returns Balance in Octas
   */
  static async getBalance(address: string): Promise<bigint> {
    try {
      const resources = await aptos.getAccountResources({
        accountAddress: address,
      });

      const coinResource = resources.find(
        (r) => r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
      );

      if (!coinResource) {
        return BigInt(0);
      }

      const balance = (coinResource.data as any).coin.value;
      return BigInt(balance);
    } catch (error) {
      console.error('[WalletService] Failed to get balance', { error, address });
      return BigInt(0);
    }
  }

  /**
   * Check if account exists on-chain
   * @param address - Wallet address
   * @returns True if account exists
   */
  static async accountExists(address: string): Promise<boolean> {
    try {
      await aptos.getAccountInfo({ accountAddress: address });
      return true;
    } catch (error) {
      return false;
    }
  }
}
