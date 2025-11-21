/**
 * File Upload Service using Vercel Blob
 * Replaces the previous IPFS implementation
 */

import { put, del, head } from '@vercel/blob';
import { logger } from '../utils/logger';

interface UploadResult {
  url: string;
  pathname: string;
  contentType: string;
  contentDisposition: string;
}

interface InvoiceMetadata {
  url: string;
  filename: string;
  size: number;
  contentType: string;
  uploadedAt: Date;
}

export class UploadService {
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  private readonly allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/webp'
  ];

  /**
   * Upload an invoice file to Vercel Blob
   */
  async uploadInvoice(
    file: Express.Multer.File,
    requestId: number
  ): Promise<InvoiceMetadata> {
    try {
      // Validate file
      this.validateFile(file);

      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedFilename = this.sanitizeFilename(file.originalname);
      const filename = `invoices/${requestId}/${timestamp}-${sanitizedFilename}`;

      logger.info('Uploading invoice to Vercel Blob', {
        filename,
        size: file.size,
        type: file.mimetype
      });

      // Upload to Vercel Blob
      const blob = await put(filename, file.buffer, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
        contentType: file.mimetype,
        addRandomSuffix: false
      });

      logger.info('Invoice uploaded successfully', {
        url: blob.url,
        pathname: blob.pathname
      });

      return {
        url: blob.url,
        filename: file.originalname,
        size: file.size,
        contentType: file.mimetype,
        uploadedAt: new Date()
      };
    } catch (error) {
      logger.error('Failed to upload invoice', { error });
      throw new Error(`File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete an invoice file from Vercel Blob
   */
  async deleteInvoice(url: string): Promise<void> {
    try {
      logger.info('Deleting invoice from Vercel Blob', { url });

      await del(url, {
        token: process.env.BLOB_READ_WRITE_TOKEN
      });

      logger.info('Invoice deleted successfully', { url });
    } catch (error) {
      logger.error('Failed to delete invoice', { error, url });
      throw new Error(`File deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get invoice metadata from Vercel Blob
   */
  async getInvoiceMetadata(url: string): Promise<{ size: number; contentType: string }> {
    try {
      const metadata = await head(url, {
        token: process.env.BLOB_READ_WRITE_TOKEN
      });

      return {
        size: metadata.size,
        contentType: metadata.contentType
      };
    } catch (error) {
      logger.error('Failed to get invoice metadata', { error, url });
      throw new Error(`Failed to get file metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a public download URL for an invoice
   * (Vercel Blob URLs are already public, so just return the URL)
   */
  getInvoiceDownloadURL(url: string): string {
    return url;
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: Express.Multer.File): void {
    // Check file exists
    if (!file) {
      throw new Error('No file provided');
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      throw new Error(`File size exceeds maximum allowed size of ${this.maxFileSize / 1024 / 1024}MB`);
    }

    // Check file type
    if (!this.allowedTypes.includes(file.mimetype)) {
      throw new Error(`File type ${file.mimetype} is not allowed. Allowed types: ${this.allowedTypes.join(', ')}`);
    }

    // Check buffer exists
    if (!file.buffer || file.buffer.length === 0) {
      throw new Error('File buffer is empty');
    }
  }

  /**
   * Sanitize filename to remove potentially dangerous characters
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace non-alphanumeric chars with underscore
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .substring(0, 100); // Limit length
  }

  /**
   * Check if Vercel Blob is configured
   */
  isConfigured(): boolean {
    return !!process.env.BLOB_READ_WRITE_TOKEN;
  }
}

// Export singleton instance
export const uploadService = new UploadService();
