import * as ed25519 from '@noble/ed25519';
import { sha3_256 } from '@noble/hashes/sha3.js';
import { logger } from './logger';
import crypto from 'crypto';

/**
 * Signature verification request interface
 */
export interface SignatureVerificationRequest {
  address: string;
  message: string;
  signature: string;
  publicKey: string;
  nonce?: string;
  timestamp?: number;
}

/**
 * Login message structure
 */
export interface LoginMessage {
  domain: string;
  address: string;
  statement: string;
  uri: string;
  version: string;
  chainId: string;
  nonce: string;
  issuedAt: string;
  expirationTime?: string;
}

/**
 * Format message according to Aptos signing standard (Petra format)
 * Per Petra docs: https://petra.app/docs/signing-a-message
 * Format: APTOS\nnonce: [value]\nmessage: [user message]
 * @param message - The message to format
 * @param nonce - Optional nonce
 * @returns Formatted message for Aptos wallet signing
 */
const formatAptosSigningMessage = (message: string, nonce?: string): string => {
  if (nonce) {
    return `APTOS\nnonce: ${nonce}\nmessage: ${message}`;
  }
  return `APTOS\nmessage: ${message}`;
};

/**
 * Verify a wallet signature for authentication
 * @param request - Signature verification request
 * @returns True if signature is valid
 */
export const verifyWalletSignature = async (
  request: SignatureVerificationRequest
): Promise<boolean> => {
  try {
    const { message, signature, publicKey, address, nonce } = request;

    // Validate inputs
    if (!message || !signature || !publicKey || !address) {
      logger.error('Missing required fields for signature verification');
      return false;
    }

    // Remove '0x' prefix if present
    const cleanSignature = signature.startsWith('0x') ? signature.slice(2) : signature;
    const cleanPublicKey = publicKey.startsWith('0x') ? publicKey.slice(2) : publicKey;

    // Convert hex strings to Uint8Array
    const signatureBytes = hexToBytes(cleanSignature);
    const publicKeyBytes = hexToBytes(cleanPublicKey);

    // Format message according to Aptos signing standard
    const formattedMessage = formatAptosSigningMessage(message, nonce);
    const messageBytes = new TextEncoder().encode(formattedMessage);

    // Debug logging
    logger.debug('Signature verification details', {
      address,
      rawMessage: message.substring(0, 100) + '...',
      formattedMessage: formattedMessage.substring(0, 150) + '...',
      signatureLength: cleanSignature.length,
      publicKeyLength: cleanPublicKey.length,
      nonce: nonce
    });

    // Verify the signature using Ed25519
    const isValid = await ed25519.verify(signatureBytes, messageBytes, publicKeyBytes);

    if (!isValid) {
      logger.warn('Invalid signature', { address });
      return false;
    }

    // Verify that the public key matches the address
    const derivedAddress = await deriveAddressFromPublicKey(cleanPublicKey);
    if (derivedAddress.toLowerCase() !== address.toLowerCase()) {
      logger.warn('Public key does not match address', {
        address,
        derivedAddress
      });
      return false;
    }

    logger.info('Signature verified successfully', { address });
    return true;
  } catch (error) {
    logger.error('Error verifying wallet signature', { error, address: request.address });
    return false;
  }
};

/**
 * Derive Aptos address from public key
 * @param publicKey - Public key in hex format (without 0x prefix)
 * @returns Derived Aptos address
 */
export const deriveAddressFromPublicKey = async (publicKey: string): Promise<string> => {
  // For Aptos, the address is derived by:
  // 1. Taking the public key bytes
  // 2. Appending single-signature scheme byte (0x00)
  // 3. Hashing with SHA3-256
  // 4. Taking first 32 bytes (addresses are 32 bytes in Aptos)

  // Note: This is a simplified version. For production, use Aptos SDK's AccountAddress.fromKey()
  // For now, we'll use a basic implementation

  const publicKeyBytes = hexToBytes(publicKey);
  const schemeBytes = new Uint8Array([0x00]); // Single signature scheme

  // Concatenate public key + scheme
  const combined = new Uint8Array(publicKeyBytes.length + schemeBytes.length);
  combined.set(publicKeyBytes);
  combined.set(schemeBytes, publicKeyBytes.length);

  // Hash with SHA3-256
  const hash = sha3_256(combined);

  // Convert to hex and add 0x prefix
  return '0x' + bytesToHex(hash);
};

/**
 * Create a login message for wallet signing
 * @param address - User's wallet address
 * @param nonce - Random nonce for replay protection
 * @returns Formatted login message
 */
export const createLoginMessage = (address: string, nonce: string): string => {
  const domain = process.env.DOMAIN || 'nyu-aptos.app';
  const uri = process.env.APP_URL || 'https://nyu-aptos.app';
  const issuedAt = new Date().toISOString();
  const expirationTime = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

  const message = `${domain} wants you to sign in with your Aptos account:
${address}

Sign in to NYU Aptos Builder Camp

URI: ${uri}
Version: 1
Chain ID: ${process.env.APTOS_NETWORK || 'testnet'}
Nonce: ${nonce}
Issued At: ${issuedAt}
Expiration Time: ${expirationTime}`;

  return message;
};

/**
 * Parse a login message
 * @param message - Login message string
 * @returns Parsed login message object
 */
export const parseLoginMessage = (message: string): Partial<LoginMessage> => {
  try {
    const lines = message.split('\n');
    const result: Partial<LoginMessage> = {};

    // Extract domain (first line)
    const domainMatch = lines[0]?.match(/^(.+?) wants you to sign in/);
    if (domainMatch) {
      result.domain = domainMatch[1];
    }

    // Extract address (second line)
    result.address = lines[1]?.trim();

    // Extract statement (fourth line)
    result.statement = lines[3]?.trim();

    // Extract other fields
    for (const line of lines) {
      const uriMatch = line.match(/^URI: (.+)$/);
      if (uriMatch) result.uri = uriMatch[1];

      const versionMatch = line.match(/^Version: (.+)$/);
      if (versionMatch) result.version = versionMatch[1];

      const chainMatch = line.match(/^Chain ID: (.+)$/);
      if (chainMatch) result.chainId = chainMatch[1];

      const nonceMatch = line.match(/^Nonce: (.+)$/);
      if (nonceMatch) result.nonce = nonceMatch[1];

      const issuedMatch = line.match(/^Issued At: (.+)$/);
      if (issuedMatch) result.issuedAt = issuedMatch[1];

      const expirationMatch = line.match(/^Expiration Time: (.+)$/);
      if (expirationMatch) result.expirationTime = expirationMatch[1];
    }

    return result;
  } catch (error) {
    logger.error('Error parsing login message', { error });
    return {};
  }
};

/**
 * Validate login message
 * @param message - Login message to validate
 * @param currentNonce - Expected nonce
 * @returns True if message is valid
 */
export const validateLoginMessage = (message: string, currentNonce?: string): boolean => {
  try {
    const parsed = parseLoginMessage(message);

    // Check required fields
    if (!parsed.address || !parsed.nonce || !parsed.issuedAt) {
      logger.error('Login message missing required fields');
      return false;
    }

    // Check nonce if provided
    if (currentNonce && parsed.nonce !== currentNonce) {
      logger.error('Nonce mismatch');
      return false;
    }

    // Check expiration
    if (parsed.expirationTime) {
      const expirationDate = new Date(parsed.expirationTime);
      if (expirationDate < new Date()) {
        logger.error('Login message has expired');
        return false;
      }
    }

    // Check issued time (should not be in the future)
    const issuedDate = new Date(parsed.issuedAt);
    if (issuedDate > new Date()) {
      logger.error('Login message issued in the future');
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error validating login message', { error });
    return false;
  }
};

/**
 * Generate a random nonce
 * @returns Random nonce string
 */
export const generateNonce = (): string => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
};

/**
 * Convert hex string to Uint8Array
 * @param hex - Hex string
 * @returns Byte array
 */
const hexToBytes = (hex: string): Uint8Array => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
};

/**
 * Convert Uint8Array to hex string
 * @param bytes - Byte array
 * @returns Hex string
 */
const bytesToHex = (bytes: Uint8Array): string => {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Validate Aptos address format
 * @param address - Address to validate
 * @returns True if valid Aptos address
 */
export const isValidAptosAddress = (address: string): boolean => {
  if (!address) return false;

  // Remove 0x prefix
  const cleanAddress = address.startsWith('0x') ? address.slice(2) : address;

  // Check if it's a valid hex string of correct length (64 characters = 32 bytes)
  const hexRegex = /^[0-9a-fA-F]{1,64}$/;
  return hexRegex.test(cleanAddress);
};