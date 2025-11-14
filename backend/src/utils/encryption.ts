import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

// Get encryption key from environment
const ENCRYPTION_SECRET = process.env.WALLET_ENCRYPTION_SECRET;

if (!ENCRYPTION_SECRET) {
  throw new Error('WALLET_ENCRYPTION_SECRET must be set in environment variables');
}

/**
 * Derive a key from the encryption secret using PBKDF2
 * @param salt - Salt for key derivation
 * @returns Derived key
 */
const deriveKey = (salt: Buffer): Buffer => {
  return crypto.pbkdf2Sync(
    ENCRYPTION_SECRET,
    salt,
    ITERATIONS,
    KEY_LENGTH,
    'sha512'
  );
};

/**
 * Encrypt data using AES-256-GCM
 * @param plaintext - Data to encrypt (e.g., private key)
 * @returns Encrypted data as hex string
 */
export const encrypt = (plaintext: string): string => {
  try {
    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);

    // Derive key from password and salt
    const key = deriveKey(salt);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt the data
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);

    // Get authentication tag
    const tag = cipher.getAuthTag();

    // Combine salt + iv + tag + encrypted data
    const combined = Buffer.concat([salt, iv, tag, encrypted]);

    // Return as hex string
    return combined.toString('hex');
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Decrypt data using AES-256-GCM
 * @param encryptedHex - Encrypted data as hex string
 * @returns Decrypted plaintext
 */
export const decrypt = (encryptedHex: string): string => {
  try {
    // Convert hex to buffer
    const combined = Buffer.from(encryptedHex, 'hex');

    // Extract components
    const salt = combined.subarray(0, SALT_LENGTH);
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = combined.subarray(
      SALT_LENGTH + IV_LENGTH,
      SALT_LENGTH + IV_LENGTH + TAG_LENGTH
    );
    const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

    // Derive key
    const key = deriveKey(salt);

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    // Decrypt the data
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Generate a random encryption key (for initial setup)
 * @returns Random 32-byte hex string
 */
export const generateEncryptionKey = (): string => {
  return crypto.randomBytes(32).toString('hex');
};