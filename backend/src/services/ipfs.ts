import { create, IPFSHTTPClient, Options } from 'ipfs-http-client';
import { logger } from '../utils/logger';
import { query } from '../config/database';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

// IPFS configuration
const IPFS_HOST = process.env.IPFS_HOST || 'localhost';
const IPFS_PORT = parseInt(process.env.IPFS_PORT || '5001');
const IPFS_PROTOCOL = process.env.IPFS_PROTOCOL || 'http';
const IPFS_GATEWAY = process.env.IPFS_GATEWAY || 'https://ipfs.io';

// Create IPFS client
let ipfsClient: IPFSHTTPClient | null = null;

export const initIPFS = (): IPFSHTTPClient => {
  if (!ipfsClient) {
    const options: Options = {
      host: IPFS_HOST,
      port: IPFS_PORT,
      protocol: IPFS_PROTOCOL,
    };

    ipfsClient = create(options);
    logger.info('IPFS client initialized', { host: IPFS_HOST, port: IPFS_PORT });
  }

  return ipfsClient;
};

// Upload file to IPFS
export const uploadToIPFS = async (
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<{
  ipfsHash: string;
  fileSize: number;
  sha256Hash: string;
}> => {
  try {
    const client = initIPFS();

    // Calculate SHA256 hash of the file
    const sha256Hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Upload to IPFS
    const result = await client.add(fileBuffer, {
      pin: true, // Pin the file to ensure it persists
      wrapWithDirectory: false,
    });

    const ipfsHash = result.cid.toString();
    const fileSize = fileBuffer.length;

    logger.info('File uploaded to IPFS', {
      ipfsHash,
      fileName,
      fileSize,
      sha256Hash,
    });

    return {
      ipfsHash,
      fileSize,
      sha256Hash,
    };
  } catch (error) {
    logger.error('Failed to upload to IPFS', { error, fileName });
    throw new Error(`IPFS upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Upload invoice for reimbursement request
export const uploadInvoice = async (
  requestId: number,
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<{
  ipfsHash: string;
  fileSize: number;
  sha256Hash: string;
}> => {
  try {
    // Upload to IPFS
    const { ipfsHash, fileSize, sha256Hash } = await uploadToIPFS(fileBuffer, fileName, mimeType);

    // Store metadata in database
    await query(
      `INSERT INTO invoice_metadata
       (request_id, ipfs_hash, file_name, file_size, mime_type, uploaded_at, verified_on_chain)
       VALUES ($1, $2, $3, $4, $5, NOW(), false)
       ON CONFLICT (request_id) DO UPDATE
       SET ipfs_hash = $2,
           file_name = $3,
           file_size = $4,
           mime_type = $5,
           uploaded_at = NOW()`,
      [requestId, ipfsHash, fileName, fileSize, mimeType]
    );

    logger.info('Invoice metadata saved', { requestId, ipfsHash });

    return {
      ipfsHash,
      fileSize,
      sha256Hash,
    };
  } catch (error) {
    logger.error('Failed to upload invoice', { error, requestId });
    throw error;
  }
};

// Get file from IPFS
export const getFromIPFS = async (ipfsHash: string): Promise<Buffer> => {
  try {
    const client = initIPFS();

    const chunks: Uint8Array[] = [];
    for await (const chunk of client.cat(ipfsHash)) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);

    logger.debug('Retrieved file from IPFS', { ipfsHash, size: buffer.length });

    return buffer;
  } catch (error) {
    logger.error('Failed to retrieve from IPFS', { error, ipfsHash });
    throw new Error(`IPFS retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Verify invoice hash against on-chain hash
export const verifyInvoiceHash = async (
  requestId: number,
  onChainHash: string
): Promise<boolean> => {
  try {
    // Get invoice metadata from database
    const result = await query<{
      ipfs_hash: string;
      file_name: string;
    }>(
      'SELECT ipfs_hash, file_name FROM invoice_metadata WHERE request_id = $1',
      [requestId]
    );

    if (result.length === 0) {
      logger.warn('Invoice metadata not found', { requestId });
      return false;
    }

    const { ipfs_hash } = result[0];

    // Retrieve file from IPFS
    const fileBuffer = await getFromIPFS(ipfs_hash);

    // Calculate SHA256 hash
    const calculatedHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Compare with on-chain hash (assuming onChainHash is hex-encoded)
    const isValid = calculatedHash === onChainHash;

    if (isValid) {
      // Update verification status in database
      await query(
        `UPDATE invoice_metadata
         SET verified_on_chain = true
         WHERE request_id = $1`,
        [requestId]
      );

      logger.info('Invoice hash verified', { requestId, ipfsHash: ipfs_hash });
    } else {
      logger.warn('Invoice hash mismatch', {
        requestId,
        calculated: calculatedHash,
        onChain: onChainHash,
      });
    }

    return isValid;
  } catch (error) {
    logger.error('Failed to verify invoice hash', { error, requestId });
    return false;
  }
};

// Get invoice URI for blockchain submission
export const getInvoiceURI = (ipfsHash: string): string => {
  return `${IPFS_GATEWAY}/ipfs/${ipfsHash}`;
};

// Pin existing IPFS hash (for ensuring persistence)
export const pinHash = async (ipfsHash: string): Promise<void> => {
  try {
    const client = initIPFS();
    await client.pin.add(ipfsHash);
    logger.info('IPFS hash pinned', { ipfsHash });
  } catch (error) {
    logger.error('Failed to pin IPFS hash', { error, ipfsHash });
    throw error;
  }
};

// Unpin IPFS hash (to free up storage)
export const unpinHash = async (ipfsHash: string): Promise<void> => {
  try {
    const client = initIPFS();
    await client.pin.rm(ipfsHash);
    logger.info('IPFS hash unpinned', { ipfsHash });
  } catch (error) {
    logger.error('Failed to unpin IPFS hash', { error, ipfsHash });
    throw error;
  }
};

// Get pinned hashes
export const getPinnedHashes = async (): Promise<string[]> => {
  try {
    const client = initIPFS();
    const pins: string[] = [];

    for await (const { cid } of client.pin.ls()) {
      pins.push(cid.toString());
    }

    logger.debug('Retrieved pinned hashes', { count: pins.length });
    return pins;
  } catch (error) {
    logger.error('Failed to retrieve pinned hashes', { error });
    throw error;
  }
};

// Validate file before upload
export const validateInvoiceFile = (
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): { valid: boolean; error?: string } => {
  // Maximum file size: 10MB
  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  if (fileBuffer.length > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size exceeds 10MB limit' };
  }

  // Allowed MIME types for invoices
  const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc
  ];

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return { valid: false, error: 'Invalid file type. Allowed: PDF, PNG, JPG, DOC, DOCX' };
  }

  // Check file extension
  const ext = path.extname(fileName).toLowerCase();
  const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx'];

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: 'Invalid file extension' };
  }

  return { valid: true };
};

// Get invoice download URL
export const getInvoiceDownloadURL = (ipfsHash: string): string => {
  return `${IPFS_GATEWAY}/ipfs/${ipfsHash}`;
};

// Get invoice metadata from database
export const getInvoiceMetadata = async (requestId: number) => {
  try {
    const result = await query<{
      ipfs_hash: string;
      file_name: string;
      file_size: number;
      mime_type: string;
      uploaded_at: Date;
      verified_on_chain: boolean;
    }>(
      `SELECT ipfs_hash, file_name, file_size, mime_type, uploaded_at, verified_on_chain
       FROM invoice_metadata
       WHERE request_id = $1`,
      [requestId]
    );

    if (result.length === 0) {
      return null;
    }

    const metadata = result[0];

    return {
      ...metadata,
      downloadUrl: getInvoiceDownloadURL(metadata.ipfs_hash),
      uri: getInvoiceURI(metadata.ipfs_hash),
    };
  } catch (error) {
    logger.error('Failed to get invoice metadata', { error, requestId });
    throw error;
  }
};
