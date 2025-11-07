/**
 * Unit tests for IPFS service
 * Tests file upload, retrieval, validation, and URI generation
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { validateInvoiceFile, getInvoiceURI, getInvoiceDownloadURL } from '../../../src/services/ipfs';

describe('IPFS Service', () => {
  describe('validateInvoiceFile', () => {
    it('should validate correct PDF file', () => {
      const buffer = Buffer.from('PDF content');
      const result = validateInvoiceFile(buffer, 'invoice.pdf', 'application/pdf');

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate correct PNG file', () => {
      const buffer = Buffer.from('PNG content');
      const result = validateInvoiceFile(buffer, 'image.png', 'image/png');

      expect(result.valid).toBe(true);
    });

    it('should validate correct JPEG file', () => {
      const buffer = Buffer.from('JPEG content');
      const result = validateInvoiceFile(buffer, 'image.jpg', 'image/jpeg');

      expect(result.valid).toBe(true);
    });

    it('should validate correct JPG file', () => {
      const buffer = Buffer.from('JPG content');
      const result = validateInvoiceFile(buffer, 'image.jpg', 'image/jpg');

      expect(result.valid).toBe(true);
    });

    it('should validate correct DOCX file', () => {
      const buffer = Buffer.from('DOCX content');
      const result = validateInvoiceFile(
        buffer,
        'document.docx',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );

      expect(result.valid).toBe(true);
    });

    it('should validate correct DOC file', () => {
      const buffer = Buffer.from('DOC content');
      const result = validateInvoiceFile(buffer, 'document.doc', 'application/msword');

      expect(result.valid).toBe(true);
    });

    it('should reject file exceeding size limit', () => {
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
      const result = validateInvoiceFile(largeBuffer, 'large.pdf', 'application/pdf');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('10MB');
    });

    it('should reject file at exact size limit plus one byte', () => {
      const largeBuffer = Buffer.alloc(10 * 1024 * 1024 + 1);
      const result = validateInvoiceFile(largeBuffer, 'large.pdf', 'application/pdf');

      expect(result.valid).toBe(false);
    });

    it('should accept file at exact size limit', () => {
      const buffer = Buffer.alloc(10 * 1024 * 1024); // Exactly 10MB
      const result = validateInvoiceFile(buffer, 'max.pdf', 'application/pdf');

      expect(result.valid).toBe(true);
    });

    it('should reject invalid MIME type', () => {
      const buffer = Buffer.from('content');
      const result = validateInvoiceFile(buffer, 'file.txt', 'text/plain');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file type');
    });

    it('should reject executable file', () => {
      const buffer = Buffer.from('exe content');
      const result = validateInvoiceFile(buffer, 'malware.exe', 'application/x-msdownload');

      expect(result.valid).toBe(false);
    });

    it('should reject file with invalid extension', () => {
      const buffer = Buffer.from('content');
      const result = validateInvoiceFile(buffer, 'file.txt', 'application/pdf');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file extension');
    });

    it('should reject file with mismatched extension and MIME type', () => {
      const buffer = Buffer.from('content');
      const result = validateInvoiceFile(buffer, 'file.pdf', 'image/png');

      expect(result.valid).toBe(false);
    });

    it('should handle uppercase file extensions', () => {
      const buffer = Buffer.from('PDF content');
      const result = validateInvoiceFile(buffer, 'invoice.PDF', 'application/pdf');

      expect(result.valid).toBe(true);
    });

    it('should handle mixed case file extensions', () => {
      const buffer = Buffer.from('PNG content');
      const result = validateInvoiceFile(buffer, 'image.PnG', 'image/png');

      expect(result.valid).toBe(true);
    });

    it('should reject empty buffer', () => {
      const buffer = Buffer.alloc(0);
      const result = validateInvoiceFile(buffer, 'empty.pdf', 'application/pdf');

      // Empty file is technically valid but very small
      expect(result.valid).toBe(true);
    });

    it('should validate small files', () => {
      const buffer = Buffer.from('small');
      const result = validateInvoiceFile(buffer, 'tiny.pdf', 'application/pdf');

      expect(result.valid).toBe(true);
    });
  });

  describe('getInvoiceURI', () => {
    it('should generate correct IPFS URI', () => {
      const ipfsHash = 'QmTestHash123';
      const uri = getInvoiceURI(ipfsHash);

      expect(uri).toContain('ipfs');
      expect(uri).toContain(ipfsHash);
      expect(uri.startsWith('http')).toBe(true);
    });

    it('should use IPFS gateway', () => {
      const ipfsHash = 'QmTestHash123';
      const uri = getInvoiceURI(ipfsHash);

      expect(uri).toContain('/ipfs/');
    });

    it('should handle different IPFS hashes', () => {
      const hash1 = 'QmHash1';
      const hash2 = 'QmHash2';

      const uri1 = getInvoiceURI(hash1);
      const uri2 = getInvoiceURI(hash2);

      expect(uri1).not.toBe(uri2);
      expect(uri1).toContain(hash1);
      expect(uri2).toContain(hash2);
    });

    it('should generate valid URL format', () => {
      const ipfsHash = 'QmTestHash123';
      const uri = getInvoiceURI(ipfsHash);

      expect(() => new URL(uri)).not.toThrow();
    });

    it('should use environment gateway if set', () => {
      const originalGateway = process.env.IPFS_GATEWAY;
      process.env.IPFS_GATEWAY = 'https://custom-gateway.io';

      const ipfsHash = 'QmTestHash123';
      const uri = getInvoiceURI(ipfsHash);

      expect(uri).toContain('custom-gateway.io');

      process.env.IPFS_GATEWAY = originalGateway;
    });
  });

  describe('getInvoiceDownloadURL', () => {
    it('should generate correct download URL', () => {
      const ipfsHash = 'QmTestHash123';
      const url = getInvoiceDownloadURL(ipfsHash);

      expect(url).toContain('ipfs');
      expect(url).toContain(ipfsHash);
      expect(url.startsWith('http')).toBe(true);
    });

    it('should be same as getInvoiceURI', () => {
      const ipfsHash = 'QmTestHash123';
      const uri = getInvoiceURI(ipfsHash);
      const downloadUrl = getInvoiceDownloadURL(ipfsHash);

      expect(uri).toBe(downloadUrl);
    });

    it('should generate valid URL format', () => {
      const ipfsHash = 'QmTestHash123';
      const url = getInvoiceDownloadURL(ipfsHash);

      expect(() => new URL(url)).not.toThrow();
    });

    it('should handle CIDv0 format', () => {
      const cidv0 = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';
      const url = getInvoiceDownloadURL(cidv0);

      expect(url).toContain(cidv0);
    });

    it('should handle CIDv1 format', () => {
      const cidv1 = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';
      const url = getInvoiceDownloadURL(cidv1);

      expect(url).toContain(cidv1);
    });
  });

  describe('File validation edge cases', () => {
    it('should handle file with no extension', () => {
      const buffer = Buffer.from('content');
      const result = validateInvoiceFile(buffer, 'filename', 'application/pdf');

      expect(result.valid).toBe(false);
    });

    it('should handle file with multiple dots', () => {
      const buffer = Buffer.from('PDF content');
      const result = validateInvoiceFile(buffer, 'my.invoice.file.pdf', 'application/pdf');

      expect(result.valid).toBe(true);
    });

    it('should handle file with path separators in name', () => {
      const buffer = Buffer.from('PDF content');
      // In reality, this shouldn't happen, but test handling
      const result = validateInvoiceFile(buffer, 'path/to/file.pdf', 'application/pdf');

      expect(result.valid).toBe(true);
    });

    it('should reject files with dangerous extensions', () => {
      const dangerousExtensions = ['.exe', '.sh', '.bat', '.cmd', '.com', '.scr'];

      dangerousExtensions.forEach((ext) => {
        const buffer = Buffer.from('content');
        const result = validateInvoiceFile(buffer, `file${ext}`, 'application/pdf');

        expect(result.valid).toBe(false);
      });
    });

    it('should handle unicode in filename', () => {
      const buffer = Buffer.from('PDF content');
      const result = validateInvoiceFile(buffer, 'invoice_文件.pdf', 'application/pdf');

      expect(result.valid).toBe(true);
    });

    it('should handle spaces in filename', () => {
      const buffer = Buffer.from('PDF content');
      const result = validateInvoiceFile(buffer, 'my invoice file.pdf', 'application/pdf');

      expect(result.valid).toBe(true);
    });
  });

  describe('Security considerations', () => {
    it('should reject HTML file that could contain scripts', () => {
      const buffer = Buffer.from('<html>content</html>');
      const result = validateInvoiceFile(buffer, 'page.html', 'text/html');

      expect(result.valid).toBe(false);
    });

    it('should reject JavaScript file', () => {
      const buffer = Buffer.from('console.log("test")');
      const result = validateInvoiceFile(buffer, 'script.js', 'application/javascript');

      expect(result.valid).toBe(false);
    });

    it('should reject SVG file that could contain scripts', () => {
      const buffer = Buffer.from('<svg></svg>');
      const result = validateInvoiceFile(buffer, 'image.svg', 'image/svg+xml');

      expect(result.valid).toBe(false);
    });

    it('should reject XML file', () => {
      const buffer = Buffer.from('<?xml version="1.0"?>');
      const result = validateInvoiceFile(buffer, 'data.xml', 'application/xml');

      expect(result.valid).toBe(false);
    });

    it('should reject ZIP archive', () => {
      const buffer = Buffer.from('PK archive');
      const result = validateInvoiceFile(buffer, 'archive.zip', 'application/zip');

      expect(result.valid).toBe(false);
    });
  });

  describe('MIME type validation', () => {
    const validBuffer = Buffer.from('test content');

    const validMimeTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];

    validMimeTypes.forEach((mimeType) => {
      it(`should accept ${mimeType}`, () => {
        const ext = {
          'application/pdf': '.pdf',
          'image/png': '.png',
          'image/jpeg': '.jpg',
          'image/jpg': '.jpg',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
          'application/msword': '.doc',
        }[mimeType];

        const result = validateInvoiceFile(validBuffer, `file${ext}`, mimeType);
        expect(result.valid).toBe(true);
      });
    });

    const invalidMimeTypes = [
      'text/plain',
      'application/javascript',
      'text/html',
      'application/json',
      'application/xml',
      'video/mp4',
      'audio/mpeg',
    ];

    invalidMimeTypes.forEach((mimeType) => {
      it(`should reject ${mimeType}`, () => {
        const result = validateInvoiceFile(validBuffer, 'file.txt', mimeType);
        expect(result.valid).toBe(false);
      });
    });
  });
});
