# Frontend Integration Guide

Guide for integrating the Next.js frontend with the backend API, authentication, WebSocket real-time updates, and Aptos blockchain.

## Overview

The architecture follows this flow:
1. User authenticates with wallet signature
2. Frontend receives JWT access and refresh tokens
3. Frontend builds transactions using Aptos SDK
4. User signs transaction with wallet
5. Transaction submitted to Aptos blockchain
6. Frontend sends transaction hash to backend for indexing
7. Backend indexer processes events and emits via WebSocket
8. Frontend receives real-time updates via WebSocket connections

## Setup

### 1. Install Aptos SDK in Frontend

```bash
cd frontend
npm install @aptos-labs/ts-sdk
```

### 2. Configure API Client

Create `/frontend/lib/api-client.ts`:

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const apiClient = {
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  },

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  },
};
```

### 3. Configure Aptos SDK

Create `/frontend/lib/aptos-config.ts`:

```typescript
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

const NETWORK = (process.env.NEXT_PUBLIC_APTOS_NETWORK || 'testnet') as Network;

const config = new AptosConfig({
  network: NETWORK,
});

export const aptos = new Aptos(config);

export const MODULE_ADDRESS = process.env.NEXT_PUBLIC_MODULE_ADDRESS!;
export const COIN_TYPE = process.env.NEXT_PUBLIC_COIN_TYPE || '0x1::aptos_coin::AptosCoin';
```

## Authentication Integration

### Wallet Signature Login Flow

```typescript
// lib/auth.ts
import { Ed25519PrivateKey, Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function loginWithWallet(account: any) {
  try {
    // Step 1: Request nonce
    const nonceRes = await fetch(`${API_BASE}/api/auth/nonce`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: account.address })
    });
    const { data: { nonce, message } } = await nonceRes.json();

    // Step 2: Sign message with wallet
    const signature = await account.signMessage({
      message: message,
      nonce: nonce
    });

    // Step 3: Login
    const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: account.address,
        message,
        signature: signature.signature,
        publicKey: signature.publicKey
      })
    });

    if (!loginRes.ok) throw new Error('Login failed');

    const { data } = await loginRes.json();

    // Step 4: Store tokens
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);

    return data.user;
  } catch (error) {
    console.error('Authentication failed:', error);
    throw error;
  }
}

export function getAccessToken(): string | null {
  return localStorage.getItem('accessToken');
}

export async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    if (!res.ok) return false;

    const { data } = await res.json();
    localStorage.setItem('accessToken', data.accessToken);
    return true;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
}

export function logout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}
```

**Usage in component:**
```typescript
'use client';

import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { loginWithWallet } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export function LoginButton() {
  const { account } = useWallet();
  const router = useRouter();

  const handleLogin = async () => {
    if (!account) return;
    try {
      const user = await loginWithWallet(account);
      console.log('Logged in as:', user);
      router.push('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed. Please try again.');
    }
  };

  return (
    <button onClick={handleLogin} disabled={!account}>
      {account ? 'Login with Wallet' : 'Connect Wallet First'}
    </button>
  );
}
```

## WebSocket Real-Time Integration

### Subscribe to Real-Time Events

```typescript
// lib/websocket.ts
import { io, Socket } from 'socket.io-client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export function connectWebSocket(accessToken?: string): Socket {
  if (socket && socket.connected) return socket;

  socket = io(API_BASE, {
    auth: accessToken ? { token: accessToken } : undefined,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
  });

  socket.on('connect', () => {
    console.log('WebSocket connected');
  });

  socket.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  socket.on('disconnect', (reason) => {
    console.log('WebSocket disconnected:', reason);
  });

  return socket;
}

export function subscribeToChannels(channels: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!socket || !socket.connected) {
      reject(new Error('WebSocket not connected'));
      return;
    }

    socket.once('subscribed', (data) => {
      console.log('Subscribed to channels:', data.channels);
      resolve();
    });

    socket.emit('subscribe', channels);

    // Timeout after 5 seconds
    setTimeout(() => reject(new Error('Subscription timeout')), 5000);
  });
}

export function onTreasuryDeposit(callback: (data: any) => void) {
  if (!socket) return;
  socket.on('treasury:deposit', callback);
}

export function onProposalVote(callback: (data: any) => void) {
  if (!socket) return;
  socket.on('proposals:vote', callback);
}

export function onReimbursementApproval(callback: (data: any) => void) {
  if (!socket) return;
  socket.on('reimbursements:approved', callback);
}

export function disconnectWebSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
```

**Usage in component:**
```typescript
'use client';

import { useEffect, useState } from 'react';
import { connectWebSocket, subscribeToChannels, onTreasuryDeposit, getAccessToken } from '@/lib/websocket';

export function RealTimeUpdates() {
  const [deposits, setDeposits] = useState<any[]>([]);

  useEffect(() => {
    const token = getAccessToken();
    const socket = connectWebSocket(token);

    // Subscribe to channels
    subscribeToChannels(['treasury:deposit'])
      .catch(error => console.error('Subscription failed:', error));

    // Listen for deposit events
    onTreasuryDeposit((data) => {
      console.log('New deposit:', data);
      setDeposits(prev => [data, ...prev]);
    });

    return () => {
      // Clean up on unmount
      socket.off('treasury:deposit');
    };
  }, []);

  return (
    <div>
      <h2>Recent Deposits</h2>
      {deposits.map((deposit, idx) => (
        <div key={idx}>
          <p>Amount: {deposit.amount}</p>
          <p>From: {deposit.source}</p>
          <p>Time: {deposit.timestamp}</p>
        </div>
      ))}
    </div>
  );
}
```

## Invoice Upload Integration

### Upload Invoice to IPFS

```typescript
// lib/ipfs.ts
import { getAccessToken } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function uploadInvoiceToIPFS(file: File) {
  const accessToken = getAccessToken();
  if (!accessToken) throw new Error('Not authenticated');

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/api/ipfs/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Upload failed');
  }

  return response.json();
}

export async function getInvoiceMetadata(requestId: number) {
  const accessToken = getAccessToken();

  const response = await fetch(
    `${API_BASE}/api/ipfs/invoice/${requestId}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );

  if (!response.ok) throw new Error('Failed to fetch invoice metadata');

  return response.json();
}
```

**Usage in component:**
```typescript
'use client';

import { useState } from 'react';
import { uploadInvoiceToIPFS } from '@/lib/ipfs';

export function InvoiceUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [ipfsHash, setIpfsHash] = useState<string>('');

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadInvoiceToIPFS(file);
      setIpfsHash(result.data.ipfsHash);
      console.log('Invoice uploaded:', result.data.gatewayUrl);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload invoice');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleUpload}>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        required
      />
      <button type="submit" disabled={uploading || !file}>
        {uploading ? 'Uploading...' : 'Upload Invoice'}
      </button>
      {ipfsHash && (
        <p>IPFS Hash: <code>{ipfsHash}</code></p>
      )}
    </form>
  );
}
```

## Integration Examples

### Treasury Operations

#### 1. Get Treasury Balance

```typescript
// frontend/lib/treasury.ts
import { apiClient } from './api-client';

export const getTreasuryBalance = async () => {
  const response = await apiClient.get<{
    success: boolean;
    data: {
      balance: string;
      balanceFormatted: string;
      coinType: string;
      timestamp: string;
    };
  }>('/api/treasury/balance');

  return response.data;
};
```

**Usage in component:**
```typescript
'use client';

import { useEffect, useState } from 'react';
import { getTreasuryBalance } from '@/lib/treasury';

export function TreasuryBalance() {
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const data = await getTreasuryBalance();
        setBalance(data.balanceFormatted);
      } catch (error) {
        console.error('Failed to fetch balance:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Treasury Balance</h2>
      <p>{balance} APT</p>
    </div>
  );
}
```

#### 2. Submit Reimbursement Request

```typescript
// frontend/lib/treasury.ts
import { aptos, MODULE_ADDRESS, COIN_TYPE } from './aptos-config';
import { apiClient } from './api-client';

export const submitReimbursement = async (
  wallet: any, // Your wallet adapter
  amount: number,
  invoiceUri: string,
  invoiceHash: string
) => {
  try {
    // 1. Build transaction
    const transaction = await aptos.transaction.build.simple({
      sender: wallet.account.address,
      data: {
        function: `${MODULE_ADDRESS}::treasury::submit_reimbursement`,
        typeArguments: [COIN_TYPE],
        functionArguments: [
          amount,
          invoiceUri,
          invoiceHash,
          Math.floor(Date.now() / 1000), // current timestamp
        ],
      },
    });

    // 2. Sign and submit to blockchain
    const pendingTxn = await wallet.signAndSubmitTransaction(transaction);

    // 3. Wait for transaction confirmation
    const committedTxn = await aptos.waitForTransaction({
      transactionHash: pendingTxn.hash,
    });

    // 4. Send transaction hash to backend for indexing
    await apiClient.post('/api/treasury/reimbursements/submit', {
      transactionHash: pendingTxn.hash,
    });

    return {
      success: true,
      txHash: pendingTxn.hash,
      version: committedTxn.version,
    };
  } catch (error) {
    console.error('Reimbursement submission failed:', error);
    throw error;
  }
};
```

**Usage in component:**
```typescript
'use client';

import { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { submitReimbursement } from '@/lib/treasury';
import { uploadInvoiceToIPFS } from '@/lib/ipfs';

export function ReimbursementForm() {
  const { account, signAndSubmitTransaction } = useWallet();
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !file) return;

    setLoading(true);
    try {
      // 1. Upload invoice to IPFS via backend
      const { ipfsHash, sha256Hash } = await uploadInvoiceToIPFS(file);
      const invoiceUri = `https://ipfs.io/ipfs/${ipfsHash}`;

      // 2. Submit reimbursement on-chain
      const result = await submitReimbursement(
        { account, signAndSubmitTransaction },
        parseFloat(amount) * 1e8, // Convert to octas
        invoiceUri,
        `0x${sha256Hash}`
      );

      alert(`Reimbursement submitted! TX: ${result.txHash}`);
    } catch (error) {
      console.error(error);
      alert('Failed to submit reimbursement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount"
        required
      />
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit Reimbursement'}
      </button>
    </form>
  );
}
```

#### 3. Approve Reimbursement

```typescript
// frontend/lib/treasury.ts
export const approveReimbursement = async (
  wallet: any,
  requestId: number
) => {
  try {
    const transaction = await aptos.transaction.build.simple({
      sender: wallet.account.address,
      data: {
        function: `${MODULE_ADDRESS}::treasury::approve_reimbursement`,
        typeArguments: [COIN_TYPE],
        functionArguments: [requestId],
      },
    });

    const pendingTxn = await wallet.signAndSubmitTransaction(transaction);
    await aptos.waitForTransaction({ transactionHash: pendingTxn.hash });

    await apiClient.post(`/api/treasury/reimbursements/${requestId}/approve`, {
      transactionHash: pendingTxn.hash,
    });

    return { success: true, txHash: pendingTxn.hash };
  } catch (error) {
    console.error('Approval failed:', error);
    throw error;
  }
};
```

### Governance Operations

#### 1. Get Elections

```typescript
// frontend/lib/governance.ts
import { apiClient } from './api-client';

export const getElections = async (filters?: {
  role?: string;
  status?: 'active' | 'finalized';
  page?: number;
  limit?: number;
}) => {
  const params = new URLSearchParams();
  if (filters?.role) params.append('role', filters.role);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const response = await apiClient.get<{
    success: boolean;
    data: {
      elections: any[];
      pagination: any;
    };
  }>(`/api/governance/elections?${params.toString()}`);

  return response.data;
};
```

#### 2. Cast Vote in Election

```typescript
// frontend/lib/governance.ts
export const castVote = async (
  wallet: any,
  roleName: string,
  electionId: number,
  candidateAddress: string
) => {
  try {
    const transaction = await aptos.transaction.build.simple({
      sender: wallet.account.address,
      data: {
        function: `${MODULE_ADDRESS}::governance::cast_vote`,
        functionArguments: [
          roleName,
          electionId,
          candidateAddress,
          Math.floor(Date.now() / 1000),
        ],
      },
    });

    const pendingTxn = await wallet.signAndSubmitTransaction(transaction);
    await aptos.waitForTransaction({ transactionHash: pendingTxn.hash });

    await apiClient.post('/api/governance/vote', {
      transactionHash: pendingTxn.hash,
    });

    return { success: true, txHash: pendingTxn.hash };
  } catch (error) {
    console.error('Vote failed:', error);
    throw error;
  }
};
```

### Proposal Operations

#### 1. Get Proposals

```typescript
// frontend/lib/proposals.ts
import { apiClient } from './api-client';

export const getProposals = async (filters?: {
  status?: number;
  creator?: string;
  page?: number;
  limit?: number;
}) => {
  const params = new URLSearchParams();
  if (filters?.status !== undefined) params.append('status', filters.status.toString());
  if (filters?.creator) params.append('creator', filters.creator);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const response = await apiClient.get<{
    success: boolean;
    data: {
      proposals: any[];
      pagination: any;
    };
  }>(`/api/proposals?${params.toString()}`);

  return response.data;
};
```

#### 2. Create Proposal

```typescript
// frontend/lib/proposals.ts
export const createProposal = async (
  wallet: any,
  title: string,
  description: string,
  startTs: number,
  endTs: number
) => {
  try {
    const transaction = await aptos.transaction.build.simple({
      sender: wallet.account.address,
      data: {
        function: `${MODULE_ADDRESS}::proposals::create_proposal`,
        functionArguments: [title, description, startTs, endTs],
      },
    });

    const pendingTxn = await wallet.signAndSubmitTransaction(transaction);
    await aptos.waitForTransaction({ transactionHash: pendingTxn.hash });

    await apiClient.post('/api/proposals/create', {
      transactionHash: pendingTxn.hash,
    });

    return { success: true, txHash: pendingTxn.hash };
  } catch (error) {
    console.error('Proposal creation failed:', error);
    throw error;
  }
};
```

#### 3. Vote on Proposal

```typescript
// frontend/lib/proposals.ts
export const voteOnProposal = async (
  wallet: any,
  proposalId: number,
  vote: boolean // true = yay, false = nay
) => {
  try {
    const transaction = await aptos.transaction.build.simple({
      sender: wallet.account.address,
      data: {
        function: `${MODULE_ADDRESS}::proposals::vote_on_proposal`,
        functionArguments: [
          proposalId,
          vote,
          Math.floor(Date.now() / 1000),
        ],
      },
    });

    const pendingTxn = await wallet.signAndSubmitTransaction(transaction);
    await aptos.waitForTransaction({ transactionHash: pendingTxn.hash });

    await apiClient.post(`/api/proposals/${proposalId}/vote`, {
      transactionHash: pendingTxn.hash,
    });

    return { success: true, txHash: pendingTxn.hash };
  } catch (error) {
    console.error('Vote failed:', error);
    throw error;
  }
};
```

### IPFS Integration

#### Upload Invoice to IPFS via Backend

```typescript
// frontend/lib/ipfs.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const uploadInvoiceToIPFS = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/ipfs/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('IPFS upload failed');
  }

  const data = await response.json();
  return {
    ipfsHash: data.ipfsHash,
    sha256Hash: data.sha256Hash,
    fileSize: data.fileSize,
  };
};
```

**Note:** You'll need to add an IPFS upload endpoint to the backend routes.

## Environment Variables

Create `/frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APTOS_NETWORK=testnet
NEXT_PUBLIC_MODULE_ADDRESS=0xYOUR_MODULE_ADDRESS
NEXT_PUBLIC_COIN_TYPE=0x1::aptos_coin::AptosCoin
```

## Wallet Integration

Install Aptos Wallet Adapter:

```bash
npm install @aptos-labs/wallet-adapter-react \
            @aptos-labs/wallet-adapter-ant-design \
            petra-plugin-wallet-adapter
```

Configure in `/frontend/app/layout.tsx`:

```typescript
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { PetraWallet } from 'petra-plugin-wallet-adapter';

const wallets = [new PetraWallet()];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AptosWalletAdapterProvider plugins={wallets} autoConnect={true}>
          {children}
        </AptosWalletAdapterProvider>
      </body>
    </html>
  );
}
```

## Real-time Updates

For real-time data updates, implement polling or WebSockets:

### Polling Example

```typescript
'use client';

import { useEffect, useState } from 'react';
import { getReimbursements } from '@/lib/treasury';

export function ReimbursementsList() {
  const [reimbursements, setReimbursements] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getReimbursements();
      setReimbursements(data.requests);
    };

    // Initial fetch
    fetchData();

    // Poll every 10 seconds
    const interval = setInterval(fetchData, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      {reimbursements.map((req) => (
        <div key={req.id}>{/* Render request */}</div>
      ))}
    </div>
  );
}
```

## Error Handling

```typescript
// frontend/lib/error-handler.ts
export class APIError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

export const handleAPIError = (error: any) => {
  if (error instanceof APIError) {
    // Handle API errors
    console.error(`API Error ${error.statusCode}:`, error.message);
  } else if (error.code) {
    // Handle blockchain errors
    console.error('Blockchain Error:', error.message);
  } else {
    // Handle unknown errors
    console.error('Unknown Error:', error);
  }

  // Show user-friendly message
  return 'An error occurred. Please try again.';
};
```

## Testing

```typescript
// frontend/__tests__/api.test.ts
import { getTreasuryBalance } from '@/lib/treasury';

describe('Treasury API', () => {
  it('should fetch treasury balance', async () => {
    const balance = await getTreasuryBalance();
    expect(balance).toBeDefined();
    expect(balance.balance).toBeDefined();
  });
});
```

## Best Practices

1. Always validate user input before building transactions
2. Show clear loading states during blockchain operations
3. Display transaction hashes for user verification
4. Implement proper error handling and user feedback
5. Cache API responses where appropriate
6. Use TypeScript for type safety
7. Implement retry logic for failed API calls
8. Show gas estimates before transaction submission
9. Verify transaction success before updating UI
10. Log errors to monitoring service (Sentry, etc.)

## Troubleshooting

### Transaction Fails
- Check wallet has sufficient balance for gas
- Verify function arguments match contract expectations
- Check network connectivity

### API Returns 404
- Verify backend is running
- Check API_BASE_URL in .env
- Ensure endpoint path is correct

### Indexer Lag
- Indexer may take a few seconds to process events
- Implement retry logic or show "pending" state
- Poll API for updates after transaction

## Additional Resources

- [Aptos TypeScript SDK Docs](https://aptos.dev/sdks/ts-sdk/)
- [Wallet Adapter Docs](https://github.com/aptos-labs/aptos-wallet-adapter)
- [Next.js Documentation](https://nextjs.org/docs)
