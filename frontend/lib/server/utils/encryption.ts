/**
 * Encryption utilities for wallet private keys
 * Uses AES-256-GCM for secure encryption
 */

import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

// Get encryption key from environment (lazily checked)
const getEncryptionSecret = (): string => {
  const secret = process.env.WALLET_ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error('WALLET_ENCRYPTION_SECRET must be set in environment variables');
  }
  return secret;
};

/**
 * Derive a key from the encryption secret using PBKDF2
 */
const deriveKey = (salt: Buffer): Buffer => {
  return crypto.pbkdf2Sync(
    getEncryptionSecret(),
    salt,
    ITERATIONS,
    KEY_LENGTH,
    'sha512'
  );
};

/**
 * Encrypt data using AES-256-GCM
 */
export const encrypt = (plaintext: string): string => {
  try {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = deriveKey(salt);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    const combined = Buffer.concat([salt, iv, tag, encrypted]);
    return combined.toString('hex');
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Decrypt data using AES-256-GCM
 */
export const decrypt = (encryptedHex: string): string => {
  try {
    const combined = Buffer.from(encryptedHex, 'hex');
    const salt = combined.subarray(0, SALT_LENGTH);
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = combined.subarray(
      SALT_LENGTH + IV_LENGTH,
      SALT_LENGTH + IV_LENGTH + TAG_LENGTH
    );
    const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const key = deriveKey(salt);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const generateEncryptionKey = (): string => {
  return crypto.randomBytes(32).toString('hex');
};
