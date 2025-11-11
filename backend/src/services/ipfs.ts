// Temporary stub - IPFS disabled due to package issues
import { logger } from '../utils/logger';

export const uploadInvoice = async () => {
  logger.error('IPFS is temporarily disabled');
  throw new Error('IPFS service temporarily unavailable');
};

export const getInvoiceMetadata = async () => {
  logger.error('IPFS is temporarily disabled');
  throw new Error('IPFS service temporarily unavailable');
};

export const getFromIPFS = async () => {
  logger.error('IPFS is temporarily disabled');
  throw new Error('IPFS service temporarily unavailable');
};

export const validateInvoiceFile = () => {
  return { valid: false, error: 'IPFS temporarily disabled' };
};

export const getInvoiceDownloadURL = (hash: string) => {
  return `#disabled-${hash}`;
};
