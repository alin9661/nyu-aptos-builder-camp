/**
 * Mock implementations for IPFS client
 * These mocks simulate IPFS operations for testing
 */

import { jest } from '@jest/globals';

/**
 * Mock IPFS CID (Content Identifier)
 */
export const createMockCID = (hash: string = 'QmTestHash123456789') => ({
  toString: () => hash,
  toV0: () => ({ toString: () => hash }),
  toV1: () => ({ toString: () => hash }),
});

/**
 * Mock IPFS upload result
 */
export const createMockUploadResult = (ipfsHash: string = 'QmTestHash123456789') => ({
  cid: createMockCID(ipfsHash),
  size: 1024,
  path: ipfsHash,
});

/**
 * Mock IPFS client
 */
export const createMockIPFSClient = () => {
  const mockClient = {
    add: jest.fn().mockResolvedValue(createMockUploadResult()),
    cat: jest.fn().mockImplementation(async function* () {
      yield Buffer.from('Mock file content');
    }),
    pin: {
      add: jest.fn().mockResolvedValue(createMockCID()),
      rm: jest.fn().mockResolvedValue(createMockCID()),
      ls: jest.fn().mockImplementation(async function* () {
        yield { cid: createMockCID() };
      }),
    },
    get: jest.fn().mockImplementation(async function* () {
      yield {
        path: 'QmTestHash123456789',
        content: (async function* () {
          yield Buffer.from('Mock file content');
        })(),
      };
    }),
    id: jest.fn().mockResolvedValue({
      id: 'QmTestPeerId',
      publicKey: 'mockPublicKey',
      addresses: ['/ip4/127.0.0.1/tcp/4001'],
      agentVersion: 'js-ipfs/0.60.0',
      protocolVersion: 'ipfs/0.1.0',
    }),
  };

  return mockClient as any;
};

/**
 * Mock file buffer for testing
 */
export const createMockFileBuffer = (
  content: string = 'Mock file content'
): Buffer => {
  return Buffer.from(content);
};

/**
 * Mock invoice file
 */
export const createMockInvoiceFile = () => ({
  buffer: createMockFileBuffer('Mock invoice PDF content'),
  filename: 'invoice-001.pdf',
  mimetype: 'application/pdf',
  size: 1024,
});

/**
 * Helper to mock IPFS module
 */
export const mockIPFSModule = () => {
  const mockClient = createMockIPFSClient();

  jest.mock('ipfs-http-client', () => ({
    create: jest.fn().mockReturnValue(mockClient),
  }));

  return mockClient;
};

/**
 * Reset all IPFS mocks
 */
export const resetIPFSMocks = (mockClient: any) => {
  if (mockClient) {
    mockClient.add?.mockReset?.();
    mockClient.cat?.mockReset?.();
    mockClient.pin?.add?.mockReset?.();
    mockClient.pin?.rm?.mockReset?.();
    mockClient.pin?.ls?.mockReset?.();
    mockClient.get?.mockReset?.();
    mockClient.id?.mockReset?.();
  }
};

/**
 * Mock IPFS service responses
 */
export const createMockIPFSUploadResponse = () => ({
  ipfsHash: 'QmTestHash123456789',
  fileSize: 1024,
  sha256Hash: 'a'.repeat(64),
});

export const createMockInvoiceMetadata = () => ({
  ipfs_hash: 'QmTestHash123456789',
  file_name: 'invoice-001.pdf',
  file_size: 1024,
  mime_type: 'application/pdf',
  uploaded_at: new Date(),
  verified_on_chain: false,
  downloadUrl: 'https://ipfs.io/ipfs/QmTestHash123456789',
  uri: 'https://ipfs.io/ipfs/QmTestHash123456789',
});
